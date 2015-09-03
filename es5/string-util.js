'use strict';

var _interopRequireDefault = function (obj) { return obj && obj.__esModule ? obj : { 'default': obj }; };

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.slugify = slugify;
exports.getHostFromURL = getHostFromURL;
exports.getBaseHost = getBaseHost;
exports.formatPhoneNumber = formatPhoneNumber;
exports.stripTags = stripTags;
exports.truncate = truncate;
exports.getYoutubeId = getYoutubeId;

var _Inflect = require('i');

var _Inflect2 = _interopRequireDefault(_Inflect);

var _upperCaseFirst$pascalCase$snakeCase$paramCase$camelCase = require('change-case');

'use strict';

var inflect = new _Inflect2['default']();
var url = require('url');

var youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/ ]{11})/i;

// Named for convenience
var pluralize = inflect.pluralize.bind(inflect);
exports.pluralize = pluralize;
var singularize = inflect.singularize.bind(inflect);
exports.singularize = singularize;
var capitalize = _upperCaseFirst$pascalCase$snakeCase$paramCase$camelCase.upperCaseFirst;
exports.capitalize = capitalize;
var pascal = _upperCaseFirst$pascalCase$snakeCase$paramCase$camelCase.pascalCase;
exports.pascal = pascal;
var camel = _upperCaseFirst$pascalCase$snakeCase$paramCase$camelCase.camelCase;
exports.camel = camel;
var snake = _upperCaseFirst$pascalCase$snakeCase$paramCase$camelCase.snakeCase;
exports.snake = snake;
var dashed = _upperCaseFirst$pascalCase$snakeCase$paramCase$camelCase.paramCase;

exports.dashed = dashed;

function slugify(str) {
  return (str || '').replace(/[^-a-z0-9._~]{1,}/gi, '-').toLowerCase();
}

function getHostFromURL(str) {
  if (str) {
    return url.parse(str).hostname;
  }
}

function getBaseHost(host) {
  host = host.replace(/https*:\/\//, '');
  return host.split('.').slice(-2).join('.');
}

function formatPhoneNumber(tel) {
  return tel.substr(0, 3) + '.' + tel.substr(3, 3) + '.' + tel.substr(6, 4);
}

function stripTags(str) {
  multiArgs(arguments.length ? arguments : [''], function () {
    str = str.replace(new RegExp('</?[^<>]*>', 'gi'), '');
  });
  return str;
}

function truncate(str, length) {
  return (str || '').length > length ? str.substr(0, length - 3) + '...' : str;
}

function getYoutubeId(url) {
  try {
    return youtubeRegex.exec(url)[1];
  } catch (ex) {}
}

function multiArgs(args, fn) {
  var result = [],
      i;
  for (i = 0; i < args.length; i++) {
    result.push(args[i]);
    if (fn) fn.call(args, args[i], i);
  }

  return result;
}