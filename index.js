var Walker  = require('node-source-walk'),
    types   = require('ast-module-types'),
    fs      = require('fs');

/**
 * Determines the type of the module from the supplied source code
 *
 * @param  {String} source
 * @return {String}
 */
function fromSource(source) {
  if (typeof source === 'undefined') throw new Error('source not supplied');

  var walker = new Walker({
        esprimaHarmony: true
      }),
      hasDefine = false,
      hasAMDTopLevelRequire = false,
      hasRequire = false,
      hasExports = false,
      hasES6Import = false,
      hasES6Export = false,
      isAMD, isCommonJS, isES6;

  walker.walk(source, function (node) {
    if (types.isDefine(node)) {
      hasDefine = true;
    }

    if (types.isRequire(node)) {
      hasRequire = true;
    }

    if (types.isExports(node)) {
      hasExports = true;
    }

    if (types.isAMDDriverScriptRequire(node)) {
      hasAMDTopLevelRequire = true;
    }

    if (types.isES6Import(node)) {
      hasES6Import = true;
    }

    if(types.isES6Export(node)) {
      hasES6Export = true;
    }
  });

  isAMD = hasDefine || hasAMDTopLevelRequire;
  isCommonJS = hasExports || (hasRequire && ! hasDefine);
  isES6 = hasES6Import || hasES6Export;

  if (isAMD) {
    return 'amd';
  }

  if (isCommonJS) {
    return 'commonjs';
  }

  if (isES6) {
    return 'es6';
  }

  return 'none';
}

/**
 * Synchronously determine the module type for the contents of the passed filepath
 *
 * @param  {String} file
 * @return {String}
 */
function sync(file) {
  if (! file) throw new Error('filename missing');

  var data = fs.readFileSync(file);
  return fromSource(data.toString());
}

/**
 * Asynchronously determines the module type for the contents of the given filepath
 *
 * @param  {String}   filepath
 * @param  {Function} cb - Executed with (err, type)
 */
module.exports = function (filepath, cb) {
  if (! filepath) {
    throw new Error('filename missing');
  }

  if (! cb) {
    throw new Error('callback missing');
  }

  fs.readFile(filepath, { encoding: 'utf8' }, function (err, data) {
    if (err) {
      return cb(err);
    }

    var type;

    try {
      type = fromSource(data);
    } catch(error) {
      return cb(error);
    }

    cb(null, type);
  });
};


module.exports.sync = sync;
module.exports.fromSource = fromSource;
