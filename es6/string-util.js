'use strict';

import Inflect from 'i';
import {
  upperCaseFirst,
  pascalCase,
  snakeCase,
  paramCase,
  camelCase
} from 'change-case';

let inflect = new Inflect();
let url = require('url');

let youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/ ]{11})/i;

// Named for convenience
export let pluralize = inflect.pluralize.bind(inflect);
export let singularize = inflect.singularize.bind(inflect);
export let capitalize = upperCaseFirst;
export let pascal = pascalCase;
export let camel = camelCase;
export let snake = snakeCase;
export let dashed = paramCase;

export function slugify(str) {
  return (str || '').replace(/[^-a-z0-9._~]{1,}/gi, '-').toLowerCase();
}

export function getHostFromURL(str) {
  if (str) return url.parse(str).hostname;
}

export function getBaseHost(host) {
  host = host.replace(/https*:\/\//, '');
  return host.split('.').slice(-2).join('.');
}

export function formatPhoneNumber(tel) {
  return tel.substr(0, 3) + '.' + tel.substr(3, 3) + '.' + tel.substr(6, 4);
}

export function stripTags(str) {
  multiArgs(arguments.length ? arguments : [''], function() {
    str = str.replace(new RegExp('<\/?[^<>]*>', 'gi'), '');
  });
  return str;
}

export function truncate(str, length) {
  return (str || '').length > length ? str.substr(0, length - 3) + '...' : str;
}

export function getYoutubeId(url) {
  try {
    return youtubeRegex.exec(url)[1];
  } catch (ex) {}
}

function multiArgs(args, fn) {
  var result = []
    , i;
  for (i = 0; i < args.length; i++) {
    result.push(args[i]);
    if (fn) fn.call(args, args[i], i);
  }

  return result;
}

