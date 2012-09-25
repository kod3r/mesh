/*jslint maxerr: 50, indent: 4, nomen: true */
/*global print, _, moment, db */
/*!
 * mesh - the MongoDB Extended Shell
 * 
 *      Version: 1.2.0
 *         Date: September 24, 2012
 *      Project: http://skratchdot.com/projects/mesh/
 *  Source Code: https://github.com/skratchdot/mesh/
 *       Issues: https://github.com/skratchdot/mesh/issues/
 * Dependencies: MongoDB v1.8+
 * 
 * Copyright 2012 <skratchdot.com>
 *   Dual licensed under the MIT or GPL Version 2 licenses.
 *   https://raw.github.com/skratchdot/mesh/master/LICENSE-MIT.txt
 *   https://raw.github.com/skratchdot/mesh/master/LICENSE-GPL.txt
 * 
 * Includes:
 * 
 *   underscore.js - http://underscorejs.org
 *     Copyright (c) 2009-2012 Jeremy Ashkenas, DocumentCloud
 * 
 *   underscore.string.js - http://epeli.github.com/underscore.string/
 *     Copyright (c) 2011 Esa-Matti Suuronen esa-matti@suuronen.org
 * 
 *   moment.js - http://momentjs.com
 *     Copyright (c) 2011-2012 Tim Wood
 * 
 *   science.js - https://github.com/jasondavies/science.js
 *     Copyright (c) 2011, Jason Davies
 * 
 */
var mesh = mesh || (function (global) {
	'use strict';

	var api,
		lastTime = null,
		config = {
			defaultPrompt : 0
		};

	/*
	 * This is the "mesh" function. If someone types: mesh(), then we will just
	 * print the current version info.
	 */
	api = function () {
		return api.version();
	};

	/*
	 * Override mesh.toString() so it calls mesh.help();
	 */
	api.toString = function () {
		api.help();
		return "";
	};

	/*
	 * We can override the default settings by calling this function.
	 * 
	 * The idea is to keep a "mesh.config.js" file that calls this function.
	 * 
	 * When updating mesh.js, we will never override mesh.config.js
	 */
	api.config = function (settings) {
		// Handle defaultPrompt
		if (settings.hasOwnProperty('defaultPrompt')) {
			config.defaultPrompt = settings.defaultPrompt;
			api.prompt(config.defaultPrompt);
		}
	};

	/*
	 * Print the current version
	 */
	api.version = function () {
		return print('mesh (the MongoDB Extended Shell) version: 1.2.0');
	};

	/*
	 * Print help information.
	 * 
	 * TODO: make sure that "help mesh" works as well by overriding default mongo help()
	 */
	api.help = function () {
		api.version();
		print('help coming soon!');
	};

	/*
	 * Sets the default prompt.
	 * 
	 * See: http://www.kchodorow.com/blog/2011/06/27/ps1/
	 * 
	 * newPrompt can be a function, or a number:
	 * 
	 *   0: '>' reset to default prompt
	 *   1: 'dbname>'
	 *   2: 'dbname>' for PRIMARY, '(dbname)>' for SECONDARY
	 *   3: 'host:dbname>'
	 *   4: '[YYYY-MM-DD hh:mm:ss] host:dbname>'
	 */
	api.prompt = function (newPrompt) {
		var base = '>';
		if (typeof newPrompt === 'function') {
			global.prompt = newPrompt;
		} else if (newPrompt === 1) {
			global.prompt = function () {
				return db.getName() + base;
			};
		} else if (newPrompt === 2) {
			global.prompt = function () {
				var isMaster = db.isMaster().ismaster;
				return (isMaster ? '' : '(') +
					db.getName() +
					(isMaster ? '' : ')') +
					base;
			};
		} else if (newPrompt === 3) {
			global.prompt = function () {
				var isMaster = db.isMaster().ismaster;
				return (isMaster ? '' : '(') +
					db.serverStatus().host + ":" +
					db.getName() +
					(isMaster ? '' : ')') +
					base;
			};
		} else if (newPrompt === 4) {
			global.prompt = function () {
				var isMaster = db.isMaster().ismaster;
				return '[' + moment().format('YYYY-MM-DD hh:mm:ss') + '] ' +
					(isMaster ? '' : '(') +
					db.serverStatus().host + ":" +
					db.getName() +
					(isMaster ? '' : ')') +
					base;
			};
		} else {
			delete global.prompt;
		}
	};

	/*
	 * Returns a sorted array of all the keys in an object
	 */
	api.keys = function (obj) {
		return _.keys(obj || global).sort();
	};

	/*
	 * If passed a function, it will display the function execution time.
	 * 
	 * If passed anything else, it will just print the current time.
	 * 
	 * This function keeps track of the last time it was called, and will output
	 * how long it's been since the last time it was called.
	 */
	api.time = function (obj) {
		var start = moment(),
			formatString = 'YYYY-MM-DD hh:mm:ss a';

		// Current Time
		print('Current Time: ' + start.format(formatString));

		// Last time called
		if (lastTime !== null) {
			print('Last time called ' + lastTime.fromNow() + ' [' + start.format(formatString) + ']');
		}

		// Execute function if one is passed
		if (typeof obj === 'function') {
			print('Executing function...');
			obj.apply();
			print(' Started ' + start.fromNow());
			print('Finished: ' + moment().format(formatString));
		}

		// Save last time
		lastTime = start;
	};

	return api;
}(this));


// HACK: so that moment.js works
// See cleanup.js
// Since window doesn't exist in the mongo shell, we are temporarily setting it
// to be the mesh object. moment.js wants to be using node, or amd, or the browser.
// We'll act like a browser, then delete the window object in cleanup.js
var window = window || mesh;

/*global print */
/*jslint maxerr: 50, indent: 4, plusplus: true */
/**
 * console.js - a quick wrapper so console calls don't error out in the mongodb shell
 * 
 * All console calls are currently just wrappers for the built in print() function that
 * comes with the mongo shell.  Eventually, it would be good to add "real" behavior to
 * the console calls.  For instance, console.error() should wrap ThrowError(), and console.timer()
 * should work as well.
 * 
 */
(function (global) {
	'use strict';

	var i = 0,
		functionNames = [
			'assert', 'clear', 'count', 'debug', 'dir',
			'dirxml', 'error', 'exception', 'group', 'groupCollapsed',
			'groupEnd', 'info', 'log', 'profile', 'profileEnd', 'table',
			'time', 'timeEnd', 'timeStamp', 'trace', 'warn'
		],
		wrapperFunction = function () {
			print.apply(global, arguments);
		};

	// Make sure console exists
	global.console = global.console || {};

	// Make sure all functions exist
	for (i = 0; i < functionNames.length; i++) {
		global.console[functionNames[i]] = global.console[functionNames[i]] || wrapperFunction;
	}

}(this));
// Underscore.js 1.3.3
// (c) 2009-2012 Jeremy Ashkenas, DocumentCloud Inc.
// Underscore may be freely distributed under the MIT license.
// Portions of Underscore are inspired or borrowed from Prototype,
// Oliver Steele's Functional, and John Resig's Micro-Templating.
// For all details and documentation:
// http://documentcloud.github.com/underscore
//     Underscore.js 1.3.3
//     (c) 2009-2012 Jeremy Ashkenas, DocumentCloud Inc.
//     Underscore may be freely distributed under the MIT license.
//     Portions of Underscore are inspired or borrowed from Prototype,
//     Oliver Steele's Functional, and John Resig's Micro-Templating.
//     For all details and documentation:
//     http://documentcloud.github.com/underscore
(function(){var e=this,t=e._,n={},r=Array.prototype,i=Object.prototype,s=Function.prototype,o=r.push,u=r.slice,a=r.concat,f=r.unshift,l=i.toString,c=i.hasOwnProperty,h=r.forEach,p=r.map,d=r.reduce,v=r.reduceRight,m=r.filter,g=r.every,y=r.some,b=r.indexOf,w=r.lastIndexOf,E=Array.isArray,S=Object.keys,x=s.bind,T=function(e){if(e instanceof T)return e;if(!(this instanceof T))return new T(e);this._wrapped=e};typeof exports!="undefined"?(typeof module!="undefined"&&module.exports&&(exports=module.exports=T),exports._=T):e._=T,T.VERSION="1.3.3";var N=T.each=T.forEach=function(e,t,r){if(e==null)return;if(h&&e.forEach===h)e.forEach(t,r);else if(e.length===+e.length){for(var i=0,s=e.length;i<s;i++)if(t.call(r,e[i],i,e)===n)return}else for(var o in e)if(T.has(e,o)&&t.call(r,e[o],o,e)===n)return};T.map=T.collect=function(e,t,n){var r=[];return e==null?r:p&&e.map===p?e.map(t,n):(N(e,function(e,i,s){r[r.length]=t.call(n,e,i,s)}),r)};var C=null;T.reduce=T.foldl=T.inject=function(e,t,n,r){var i=arguments.length>2;e==null&&(e=[]);if(!C&&d&&e.reduce===d)return r&&(t=T.bind(t,r)),i?e.reduce(t,n):e.reduce(t);N(e,function(e,s,o){C&&(s=C.keys[s],o=C.list),i?n=t.call(r,n,e,s,o):(n=e,i=!0)});if(!i)throw new TypeError("Reduce of empty array with no initial value");return n},T.reduceRight=T.foldr=function(e,t,n,r){var i=arguments.length>2;e==null&&(e=[]);if(v&&e.reduceRight===v)return r&&(t=T.bind(t,r)),arguments.length>2?e.reduceRight(t,n):e.reduceRight(t);var s=T.toArray(e).reverse();r&&!i&&(t=T.bind(t,r)),C={keys:T.keys(e).reverse(),list:e};var o=i?T.reduce(s,t,n,r):T.reduce(s,t);return C=null,o},T.find=T.detect=function(e,t,n){var r;return k(e,function(e,i,s){if(t.call(n,e,i,s))return r=e,!0}),r},T.filter=T.select=function(e,t,n){var r=[];return e==null?r:m&&e.filter===m?e.filter(t,n):(N(e,function(e,i,s){t.call(n,e,i,s)&&(r[r.length]=e)}),r)},T.reject=function(e,t,n){var r=[];return e==null?r:(N(e,function(e,i,s){t.call(n,e,i,s)||(r[r.length]=e)}),r)},T.every=T.all=function(e,t,r){t||(t=T.identity);var i=!0;return e==null?i:g&&e.every===g?e.every(t,r):(N(e,function(e,s,o){if(!(i=i&&t.call(r,e,s,o)))return n}),!!i)};var k=T.some=T.any=function(e,t,r){t||(t=T.identity);var i=!1;return e==null?i:y&&e.some===y?e.some(t,r):(N(e,function(e,s,o){if(i||(i=t.call(r,e,s,o)))return n}),!!i)};T.contains=T.include=function(e,t){var n=!1;return e==null?n:b&&e.indexOf===b?e.indexOf(t)!=-1:(n=k(e,function(e){return e===t}),n)},T.invoke=function(e,t){var n=u.call(arguments,2);return T.map(e,function(e){return(T.isFunction(t)?t:e[t]).apply(e,n)})},T.pluck=function(e,t){return T.map(e,function(e){return e[t]})},T.where=function(e,t){return T.isEmpty(t)?[]:T.filter(e,function(e){for(var n in t)if(t[n]!==e[n])return!1;return!0})},T.max=function(e,t,n){if(!t&&T.isArray(e)&&e[0]===+e[0]&&e.length<65535)return Math.max.apply(Math,e);if(!t&&T.isEmpty(e))return-Infinity;var r={computed:-Infinity};return N(e,function(e,i,s){var o=t?t.call(n,e,i,s):e;o>=r.computed&&(r={value:e,computed:o})}),r.value},T.min=function(e,t,n){if(!t&&T.isArray(e)&&e[0]===+e[0]&&e.length<65535)return Math.min.apply(Math,e);if(!t&&T.isEmpty(e))return Infinity;var r={computed:Infinity};return N(e,function(e,i,s){var o=t?t.call(n,e,i,s):e;o<r.computed&&(r={value:e,computed:o})}),r.value},T.shuffle=function(e){var t,n=0,r=[];return N(e,function(e){t=T.random(n++),r[n-1]=r[t],r[t]=e}),r};var L=function(e){return T.isFunction(e)?e:function(t){return t[e]}};T.sortBy=function(e,t,n){var r=L(t);return T.pluck(T.map(e,function(e,t,i){return{value:e,index:t,criteria:r.call(n,e,t,i)}}).sort(function(e,t){var n=e.criteria,r=t.criteria;if(n!==r){if(n>r||n===void 0)return 1;if(n<r||r===void 0)return-1}return e.index<t.index?-1:1}),"value")};var A=function(e,t,n,r){var i={},s=L(t);return N(e,function(e,t){var o=s.call(n,e,t);r(i,o,e)}),i};T.groupBy=function(e,t,n){return A(e,t,n,function(e,t,n){(e[t]||(e[t]=[])).push(n)})},T.countBy=function(e,t,n){return A(e,t,n,function(e,t,n){e[t]||(e[t]=0),e[t]++})},T.sortedIndex=function(e,t,n){n||(n=T.identity);var r=n(t),i=0,s=e.length;while(i<s){var o=i+s>>1;n(e[o])<r?i=o+1:s=o}return i},T.toArray=function(e){return e?e.length===+e.length?u.call(e):T.values(e):[]},T.size=function(e){return e.length===+e.length?e.length:T.keys(e).length},T.first=T.head=T.take=function(e,t,n){return t!=null&&!n?u.call(e,0,t):e[0]},T.initial=function(e,t,n){return u.call(e,0,e.length-(t==null||n?1:t))},T.last=function(e,t,n){return t!=null&&!n?u.call(e,Math.max(e.length-t,0)):e[e.length-1]},T.rest=T.tail=T.drop=function(e,t,n){return u.call(e,t==null||n?1:t)},T.compact=function(e){return T.filter(e,function(e){return!!e})};var O=function(e,t,n){return N(e,function(e){T.isArray(e)?t?o.apply(n,e):O(e,t,n):n.push(e)}),n};T.flatten=function(e,t){return O(e,t,[])},T.without=function(e){return T.difference(e,u.call(arguments,1))},T.uniq=T.unique=function(e,t,n){var r=n?T.map(e,n):e,i=[],s=[];return N(r,function(n,r){if(t?!r||s[s.length-1]!==n:!T.contains(s,n))s.push(n),i.push(e[r])}),i},T.union=function(){return T.uniq(a.apply(r,arguments))},T.intersection=function(e){var t=u.call(arguments,1);return T.filter(T.uniq(e),function(e){return T.every(t,function(t){return T.indexOf(t,e)>=0})})},T.difference=function(e){var t=a.apply(r,u.call(arguments,1));return T.filter(e,function(e){return!T.contains(t,e)})},T.zip=function(){var e=u.call(arguments),t=T.max(T.pluck(e,"length")),n=new Array(t);for(var r=0;r<t;r++)n[r]=T.pluck(e,""+r);return n},T.object=function(e,t){var n={};for(var r=0,i=e.length;r<i;r++)t?n[e[r]]=t[r]:n[e[r][0]]=e[r][1];return n},T.indexOf=function(e,t,n){if(e==null)return-1;var r,i;if(n)return r=T.sortedIndex(e,t),e[r]===t?r:-1;if(b&&e.indexOf===b)return e.indexOf(t);for(r=0,i=e.length;r<i;r++)if(e[r]===t)return r;return-1},T.lastIndexOf=function(e,t){if(e==null)return-1;if(w&&e.lastIndexOf===w)return e.lastIndexOf(t);var n=e.length;while(n--)if(e[n]===t)return n;return-1},T.range=function(e,t,n){arguments.length<=1&&(t=e||0,e=0),n=arguments[2]||1;var r=Math.max(Math.ceil((t-e)/n),0),i=0,s=new Array(r);while(i<r)s[i++]=e,e+=n;return s};var M=function(){};T.bind=function(t,n){var r,i;if(t.bind===x&&x)return x.apply(t,u.call(arguments,1));if(!T.isFunction(t))throw new TypeError;return i=u.call(arguments,2),r=function(){if(this instanceof r){M.prototype=t.prototype;var e=new M,s=t.apply(e,i.concat(u.call(arguments)));return Object(s)===s?s:e}return t.apply(n,i.concat(u.call(arguments)))}},T.bindAll=function(e){var t=u.call(arguments,1);return t.length==0&&(t=T.functions(e)),N(t,function(t){e[t]=T.bind(e[t],e)}),e},T.memoize=function(e,t){var n={};return t||(t=T.identity),function(){var r=t.apply(this,arguments);return T.has(n,r)?n[r]:n[r]=e.apply(this,arguments)}},T.delay=function(e,t){var n=u.call(arguments,2);return setTimeout(function(){return e.apply(null,n)},t)},T.defer=function(e){return T.delay.apply(T,[e,1].concat(u.call(arguments,1)))},T.throttle=function(e,t){var n,r,i,s,o,u,a=T.debounce(function(){o=s=!1},t);return function(){n=this,r=arguments;var f=function(){i=null,o&&(u=e.apply(n,r)),a()};return i||(i=setTimeout(f,t)),s?o=!0:(s=!0,u=e.apply(n,r)),a(),u}},T.debounce=function(e,t,n){var r,i;return function(){var s=this,o=arguments,u=function(){r=null,n||(i=e.apply(s,o))},a=n&&!r;return clearTimeout(r),r=setTimeout(u,t),a&&(i=e.apply(s,o)),i}},T.once=function(e){var t=!1,n;return function(){return t?n:(t=!0,n=e.apply(this,arguments),e=null,n)}},T.wrap=function(e,t){return function(){var n=[e];return o.apply(n,arguments),t.apply(this,n)}},T.compose=function(){var e=arguments;return function(){var t=arguments;for(var n=e.length-1;n>=0;n--)t=[e[n].apply(this,t)];return t[0]}},T.after=function(e,t){return e<=0?t():function(){if(--e<1)return t.apply(this,arguments)}},T.keys=S||function(e){if(e!==Object(e))throw new TypeError("Invalid object");var t=[];for(var n in e)T.has(e,n)&&(t[t.length]=n);return t},T.values=function(e){var t=[];for(var n in e)T.has(e,n)&&t.push(e[n]);return t},T.pairs=function(e){var t=[];for(var n in e)T.has(e,n)&&t.push([n,e[n]]);return t},T.invert=function(e){var t={};for(var n in e)T.has(e,n)&&(t[e[n]]=n);return t},T.functions=T.methods=function(e){var t=[];for(var n in e)T.isFunction(e[n])&&t.push(n);return t.sort()},T.extend=function(e){return N(u.call(arguments,1),function(t){for(var n in t)e[n]=t[n]}),e},T.pick=function(e){var t={},n=a.apply(r,u.call(arguments,1));return N(n,function(n){n in e&&(t[n]=e[n])}),t},T.omit=function(e){var t={},n=a.apply(r,u.call(arguments,1));for(var i in e)T.contains(n,i)||(t[i]=e[i]);return t},T.defaults=function(e){return N(u.call(arguments,1),function(t){for(var n in t)e[n]==null&&(e[n]=t[n])}),e},T.clone=function(e){return T.isObject(e)?T.isArray(e)?e.slice():T.extend({},e):e},T.tap=function(e,t){return t(e),e};var _=function(e,t,n,r){if(e===t)return e!==0||1/e==1/t;if(e==null||t==null)return e===t;e instanceof T&&(e=e._wrapped),t instanceof T&&(t=t._wrapped);var i=l.call(e);if(i!=l.call(t))return!1;switch(i){case"[object String]":return e==String(t);case"[object Number]":return e!=+e?t!=+t:e==0?1/e==1/t:e==+t;case"[object Date]":case"[object Boolean]":return+e==+t;case"[object RegExp]":return e.source==t.source&&e.global==t.global&&e.multiline==t.multiline&&e.ignoreCase==t.ignoreCase}if(typeof e!="object"||typeof t!="object")return!1;var s=n.length;while(s--)if(n[s]==e)return r[s]==t;n.push(e),r.push(t);var o=0,u=!0;if(i=="[object Array]"){o=e.length,u=o==t.length;if(u)while(o--)if(!(u=_(e[o],t[o],n,r)))break}else{var a=e.constructor,f=t.constructor;if(a!==f&&!(T.isFunction(a)&&a instanceof a&&T.isFunction(f)&&f instanceof f))return!1;for(var c in e)if(T.has(e,c)){o++;if(!(u=T.has(t,c)&&_(e[c],t[c],n,r)))break}if(u){for(c in t)if(T.has(t,c)&&!(o--))break;u=!o}}return n.pop(),r.pop(),u};T.isEqual=function(e,t){return _(e,t,[],[])},T.isEmpty=function(e){if(e==null)return!0;if(T.isArray(e)||T.isString(e))return e.length===0;for(var t in e)if(T.has(e,t))return!1;return!0},T.isElement=function(e){return!!e&&e.nodeType==1},T.isArray=E||function(e){return l.call(e)=="[object Array]"},T.isObject=function(e){return e===Object(e)},N(["Arguments","Function","String","Number","Date","RegExp"],function(e){T["is"+e]=function(t){return l.call(t)=="[object "+e+"]"}}),T.isArguments(arguments)||(T.isArguments=function(e){return!!e&&!!T.has(e,"callee")}),typeof /./!="function"&&(T.isFunction=function(e){return typeof e=="function"}),T.isFinite=function(e){return T.isNumber(e)&&isFinite(e)},T.isNaN=function(e){return T.isNumber(e)&&e!=+e},T.isBoolean=function(e){return e===!0||e===!1||l.call(e)=="[object Boolean]"},T.isNull=function(e){return e===null},T.isUndefined=function(e){return e===void 0},T.has=function(e,t){return c.call(e,t)},T.noConflict=function(){return e._=t,this},T.identity=function(e){return e},T.times=function(e,t,n){for(var r=0;r<e;r++)t.call(n,r)},T.random=function(e,t){return t==null&&(t=e,e=0),e+(0|Math.random()*(t-e+1))};var D={escape:{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#x27;","/":"&#x2F;"}};D.unescape=T.invert(D.escape);var P={escape:new RegExp("["+T.keys(D.escape).join("")+"]","g"),unescape:new RegExp("("+T.keys(D.unescape).join("|")+")","g")};T.each(["escape","unescape"],function(e){T[e]=function(t){return t==null?"":(""+t).replace(P[e],function(t){return D[e][t]})}}),T.result=function(e,t){if(e==null)return null;var n=e[t];return T.isFunction(n)?n.call(e):n},T.mixin=function(e){N(T.functions(e),function(t){var n=T[t]=e[t];T.prototype[t]=function(){var e=[this._wrapped];return o.apply(e,arguments),I.call(this,n.apply(T,e))}})};var H=0;T.uniqueId=function(e){var t=H++;return e?e+t:t},T.templateSettings={evaluate:/<%([\s\S]+?)%>/g,interpolate:/<%=([\s\S]+?)%>/g,escape:/<%-([\s\S]+?)%>/g};var B=/(.)^/,j={"'":"'","\\":"\\","\r":"r","\n":"n","	":"t","\u2028":"u2028","\u2029":"u2029"},F=/\\|'|\r|\n|\t|\u2028|\u2029/g;T.template=function(e,t,n){n=T.defaults({},n,T.templateSettings);var r=new RegExp([(n.escape||B).source,(n.interpolate||B).source,(n.evaluate||B).source].join("|")+"|$","g"),i=0,s="__p+='";e.replace(r,function(t,n,r,o,u){s+=e.slice(i,u).replace(F,function(e){return"\\"+j[e]}),s+=n?"'+\n((__t=("+n+"))==null?'':_.escape(__t))+\n'":r?"'+\n((__t=("+r+"))==null?'':__t)+\n'":o?"';\n"+o+"\n__p+='":"",i=u+t.length}),s+="';\n",n.variable||(s="with(obj||{}){\n"+s+"}\n"),s="var __t,__p='',__j=Array.prototype.join,print=function(){__p+=__j.call(arguments,'');};\n"+s+"return __p;\n";try{var o=new Function(n.variable||"obj","_",s)}catch(u){throw u.source=s,u}if(t)return o(t,T);var a=function(e){return o.call(this,e,T)};return a.source="function("+(n.variable||"obj")+"){\n"+s+"}",a},T.chain=function(e){return T(e).chain()};var I=function(e){return this._chain?T(e).chain():e};T.mixin(T),N(["pop","push","reverse","shift","sort","splice","unshift"],function(e){var t=r[e];T.prototype[e]=function(){var n=this._wrapped;return t.apply(n,arguments),(e=="shift"||e=="splice")&&n.length===0&&delete n[0],I.call(this,n)}}),N(["concat","join","slice"],function(e){var t=r[e];T.prototype[e]=function(){return I.call(this,t.apply(this._wrapped,arguments))}}),T.extend(T.prototype,{chain:function(){return this._chain=!0,this},value:function(){return this._wrapped}})}).call(this);!function(e,t){"use strict";var n=t.prototype.trim,r=t.prototype.trimRight,i=t.prototype.trimLeft,s=function(e){return e*1||0},o=function(e,t){if(t<1)return"";var n="";while(t>0)t&1&&(n+=e),t>>=1,e+=e;return n},u=[].slice,a=function(e){return e==null?"\\s":e.source?e.source:"["+p.escapeRegExp(e)+"]"},f={lt:"<",gt:">",quot:'"',apos:"'",amp:"&"},l={};for(var c in f)l[f[c]]=c;var h=function(){function e(e){return Object.prototype.toString.call(e).slice(8,-1).toLowerCase()}var n=o,r=function(){return r.cache.hasOwnProperty(arguments[0])||(r.cache[arguments[0]]=r.parse(arguments[0])),r.format.call(null,r.cache[arguments[0]],arguments)};return r.format=function(r,i){var s=1,o=r.length,u="",a,f=[],l,c,p,d,v,m;for(l=0;l<o;l++){u=e(r[l]);if(u==="string")f.push(r[l]);else if(u==="array"){p=r[l];if(p[2]){a=i[s];for(c=0;c<p[2].length;c++){if(!a.hasOwnProperty(p[2][c]))throw new Error(h('[_.sprintf] property "%s" does not exist',p[2][c]));a=a[p[2][c]]}}else p[1]?a=i[p[1]]:a=i[s++];if(/[^s]/.test(p[8])&&e(a)!="number")throw new Error(h("[_.sprintf] expecting number but found %s",e(a)));switch(p[8]){case"b":a=a.toString(2);break;case"c":a=t.fromCharCode(a);break;case"d":a=parseInt(a,10);break;case"e":a=p[7]?a.toExponential(p[7]):a.toExponential();break;case"f":a=p[7]?parseFloat(a).toFixed(p[7]):parseFloat(a);break;case"o":a=a.toString(8);break;case"s":a=(a=t(a))&&p[7]?a.substring(0,p[7]):a;break;case"u":a=Math.abs(a);break;case"x":a=a.toString(16);break;case"X":a=a.toString(16).toUpperCase()}a=/[def]/.test(p[8])&&p[3]&&a>=0?"+"+a:a,v=p[4]?p[4]=="0"?"0":p[4].charAt(1):" ",m=p[6]-t(a).length,d=p[6]?n(v,m):"",f.push(p[5]?a+d:d+a)}}return f.join("")},r.cache={},r.parse=function(e){var t=e,n=[],r=[],i=0;while(t){if((n=/^[^\x25]+/.exec(t))!==null)r.push(n[0]);else if((n=/^\x25{2}/.exec(t))!==null)r.push("%");else{if((n=/^\x25(?:([1-9]\d*)\$|\(([^\)]+)\))?(\+)?(0|'[^$])?(-)?(\d+)?(?:\.(\d+))?([b-fosuxX])/.exec(t))===null)throw new Error("[_.sprintf] huh?");if(n[2]){i|=1;var s=[],o=n[2],u=[];if((u=/^([a-z_][a-z_\d]*)/i.exec(o))===null)throw new Error("[_.sprintf] huh?");s.push(u[1]);while((o=o.substring(u[0].length))!=="")if((u=/^\.([a-z_][a-z_\d]*)/i.exec(o))!==null)s.push(u[1]);else{if((u=/^\[(\d+)\]/.exec(o))===null)throw new Error("[_.sprintf] huh?");s.push(u[1])}n[2]=s}else i|=2;if(i===3)throw new Error("[_.sprintf] mixing positional and named placeholders is not (yet) supported");r.push(n)}t=t.substring(n[0].length)}return r},r}(),p={VERSION:"2.3.0",isBlank:function(e){return e==null&&(e=""),/^\s*$/.test(e)},stripTags:function(e){return e==null?"":t(e).replace(/<\/?[^>]+>/g,"")},capitalize:function(e){return e=e==null?"":t(e),e.charAt(0).toUpperCase()+e.slice(1)},chop:function(e,n){return e==null?[]:(e=t(e),n=~~n,n>0?e.match(new RegExp(".{1,"+n+"}","g")):[e])},clean:function(e){return p.strip(e).replace(/\s+/g," ")},count:function(e,n){return e==null||n==null?0:t(e).split(n).length-1},chars:function(e){return e==null?[]:t(e).split("")},swapCase:function(e){return e==null?"":t(e).replace(/\S/g,function(e){return e===e.toUpperCase()?e.toLowerCase():e.toUpperCase()})},escapeHTML:function(e){return e==null?"":t(e).replace(/[&<>"']/g,function(e){return"&"+l[e]+";"})},unescapeHTML:function(e){return e==null?"":t(e).replace(/\&([^;]+);/g,function(e,n){var r;return n in f?f[n]:(r=n.match(/^#x([\da-fA-F]+)$/))?t.fromCharCode(parseInt(r[1],16)):(r=n.match(/^#(\d+)$/))?t.fromCharCode(~~r[1]):e})},escapeRegExp:function(e){return e==null?"":t(e).replace(/([.*+?^=!:${}()|[\]\/\\])/g,"\\$1")},splice:function(e,t,n,r){var i=p.chars(e);return i.splice(~~t,~~n,r),i.join("")},insert:function(e,t,n){return p.splice(e,t,0,n)},include:function(e,n){return n===""?!0:e==null?!1:t(e).indexOf(n)!==-1},join:function(){var e=u.call(arguments),t=e.shift();return t==null&&(t=""),e.join(t)},lines:function(e){return e==null?[]:t(e).split("\n")},reverse:function(e){return p.chars(e).reverse().join("")},startsWith:function(e,n){return n===""?!0:e==null||n==null?!1:(e=t(e),n=t(n),e.length>=n.length&&e.slice(0,n.length)===n)},endsWith:function(e,n){return n===""?!0:e==null||n==null?!1:(e=t(e),n=t(n),e.length>=n.length&&e.slice(e.length-n.length)===n)},succ:function(e){return e==null?"":(e=t(e),e.slice(0,-1)+t.fromCharCode(e.charCodeAt(e.length-1)+1))},titleize:function(e){return e==null?"":t(e).replace(/(?:^|\s)\S/g,function(e){return e.toUpperCase()})},camelize:function(e){return p.trim(e).replace(/[-_\s]+(.)?/g,function(e,t){return t.toUpperCase()})},underscored:function(e){return p.trim(e).replace(/([a-z\d])([A-Z]+)/g,"$1_$2").replace(/[-\s]+/g,"_").toLowerCase()},dasherize:function(e){return p.trim(e).replace(/([A-Z])/g,"-$1").replace(/[-_\s]+/g,"-").toLowerCase()},classify:function(e){return p.titleize(t(e).replace(/_/g," ")).replace(/\s/g,"")},humanize:function(e){return p.capitalize(p.underscored(e).replace(/_id$/,"").replace(/_/g," "))},trim:function(e,r){return e==null?"":!r&&n?n.call(e):(r=a(r),t(e).replace(new RegExp("^"+r+"+|"+r+"+$","g"),""))},ltrim:function(e,n){return e==null?"":!n&&i?i.call(e):(n=a(n),t(e).replace(new RegExp("^"+n+"+"),""))},rtrim:function(e,n){return e==null?"":!n&&r?r.call(e):(n=a(n),t(e).replace(new RegExp(n+"+$"),""))},truncate:function(e,n,r){return e==null?"":(e=t(e),r=r||"...",n=~~n,e.length>n?e.slice(0,n)+r:e)},prune:function(e,n,r){if(e==null)return"";e=t(e),n=~~n,r=r!=null?t(r):"...";if(e.length<=n)return e;var i=function(e){return e.toUpperCase()!==e.toLowerCase()?"A":" "},s=e.slice(0,n+1).replace(/.(?=\W*\w*$)/g,i);return s.slice(s.length-2).match(/\w\w/)?s=s.replace(/\s*\S+$/,""):s=p.rtrim(s.slice(0,s.length-1)),(s+r).length>e.length?e:e.slice(0,s.length)+r},words:function(e,t){return p.isBlank(e)?[]:p.trim(e,t).split(t||/\s+/)},pad:function(e,n,r,i){e=e==null?"":t(e),n=~~n;var s=0;r?r.length>1&&(r=r.charAt(0)):r=" ";switch(i){case"right":return s=n-e.length,e+o(r,s);case"both":return s=n-e.length,o(r,Math.ceil(s/2))+e+o(r,Math.floor(s/2));default:return s=n-e.length,o(r,s)+e}},lpad:function(e,t,n){return p.pad(e,t,n)},rpad:function(e,t,n){return p.pad(e,t,n,"right")},lrpad:function(e,t,n){return p.pad(e,t,n,"both")},sprintf:h,vsprintf:function(e,t){return t.unshift(e),h.apply(null,t)},toNumber:function(e,n){if(e==null||e=="")return 0;e=t(e);var r=s(s(e).toFixed(~~n));return r===0&&!e.match(/^0+$/)?Number.NaN:r},numberFormat:function(e,t,n,r){if(isNaN(e)||e==null)return"";e=e.toFixed(~~t),r=r||",";var i=e.split("."),s=i[0],o=i[1]?(n||".")+i[1]:"";return s.replace(/(\d)(?=(?:\d{3})+$)/g,"$1"+r)+o},strRight:function(e,n){if(e==null)return"";e=t(e),n=n!=null?t(n):n;var r=n?e.indexOf(n):-1;return~r?e.slice(r+n.length,e.length):e},strRightBack:function(e,n){if(e==null)return"";e=t(e),n=n!=null?t(n):n;var r=n?e.lastIndexOf(n):-1;return~r?e.slice(r+n.length,e.length):e},strLeft:function(e,n){if(e==null)return"";e=t(e),n=n!=null?t(n):n;var r=n?e.indexOf(n):-1;return~r?e.slice(0,r):e},strLeftBack:function(e,t){if(e==null)return"";e+="",t=t!=null?""+t:t;var n=e.lastIndexOf(t);return~n?e.slice(0,n):e},toSentence:function(e,t,n,r){t=t||", ",n=n||" and ";var i=e.slice(),s=i.pop();return e.length>2&&r&&(n=p.rtrim(t)+n),i.length?i.join(t)+n+s:s},toSentenceSerial:function(){var e=u.call(arguments);return e[3]=!0,p.toSentence.apply(p,e)},slugify:function(e){if(e==null)return"";var n="ąàáäâãåæćęèéëêìíïîłńòóöôõøùúüûñçżź",r="aaaaaaaaceeeeeiiiilnoooooouuuunczz",i=new RegExp(a(n),"g");return e=t(e).toLowerCase().replace(i,function(e){var t=n.indexOf(e);return r.charAt(t)||"-"}),p.dasherize(e.replace(/[^\w\s-]/g,""))},surround:function(e,t){return[t,e,t].join("")},quote:function(e){return p.surround(e,'"')},exports:function(){var e={};for(var t in this){if(!this.hasOwnProperty(t)||t.match(/^(?:include|contains|reverse)$/))continue;e[t]=this[t]}return e},repeat:function(e,n,r){if(e==null)return"";n=~~n;if(r==null)return o(t(e),n);for(var i=[];n>0;i[--n]=e);return i.join(r)},levenshtein:function(e,n){if(e==null&&n==null)return 0;if(e==null)return t(n).length;if(n==null)return t(e).length;e=t(e),n=t(n);var r=[],i,s;for(var o=0;o<=n.length;o++)for(var u=0;u<=e.length;u++)o&&u?e.charAt(u-1)===n.charAt(o-1)?s=i:s=Math.min(r[u],r[u-1],i)+1:s=o+u,i=r[u],r[u]=s;return r.pop()}};p.strip=p.trim,p.lstrip=p.ltrim,p.rstrip=p.rtrim,p.center=p.lrpad,p.rjust=p.lpad,p.ljust=p.rpad,p.contains=p.include,p.q=p.quote,typeof exports!="undefined"?(typeof module!="undefined"&&module.exports&&(module.exports=p),exports._s=p):typeof define=="function"&&define.amd?define("underscore.string",[],function(){return p}):(e._=e._||{},e._.string=e._.str=p)}(this,String);// moment.js
// version : 1.7.0
// author : Tim Wood
// license : MIT
// momentjs.com
(function(a,b){function G(a,b,c){this._d=a,this._isUTC=!!b,this._a=a._a||null,a._a=null,this._lang=c||!1}function H(a){var b=this._data={},c=a.years||a.y||0,d=a.months||a.M||0,e=a.weeks||a.w||0,f=a.days||a.d||0,g=a.hours||a.h||0,h=a.minutes||a.m||0,i=a.seconds||a.s||0,j=a.milliseconds||a.ms||0;this._milliseconds=j+i*1e3+h*6e4+g*36e5,this._days=f+e*7,this._months=d+c*12,b.milliseconds=j%1e3,i+=I(j/1e3),b.seconds=i%60,h+=I(i/60),b.minutes=h%60,g+=I(h/60),b.hours=g%24,f+=I(g/24),f+=e*7,b.days=f%30,d+=I(f/30),b.months=d%12,c+=I(d/12),b.years=c,this._lang=!1}function I(a){return a<0?Math.ceil(a):Math.floor(a)}function J(a,b){var c=a+"";while(c.length<b)c="0"+c;return c}function K(a,b,c){var d=b._milliseconds,e=b._days,f=b._months,g;d&&a._d.setTime(+a+d*c),e&&a.date(a.date()+e*c),f&&(g=a.date(),a.date(1).month(a.month()+f*c).date(Math.min(g,a.daysInMonth())))}function L(a){return Object.prototype.toString.call(a)==="[object Array]"}function M(a,b){var c=Math.min(a.length,b.length),d=Math.abs(a.length-b.length),e=0,f;for(f=0;f<c;f++)~~a[f]!==~~b[f]&&e++;return e+d}function N(b,c){var d,e;for(d=1;d<7;d++)b[d]=b[d]==null?d===2?1:0:b[d];return b[7]=c,e=new a(0),c?(e.setUTCFullYear(b[0],b[1],b[2]),e.setUTCHours(b[3],b[4],b[5],b[6])):(e.setFullYear(b[0],b[1],b[2]),e.setHours(b[3],b[4],b[5],b[6])),e._a=b,e}function O(a,b){var d,e,f=[];!b&&i&&(b=require("./lang/"+a));for(d=0;d<j.length;d++)b[j[d]]=b[j[d]]||g.en[j[d]];for(d=0;d<12;d++)e=c([2e3,d]),f[d]=new RegExp("^"+(b.months[d]||b.months(e,""))+"|^"+(b.monthsShort[d]||b.monthsShort(e,"")).replace(".",""),"i");return b.monthsParse=b.monthsParse||f,g[a]=b,b}function P(a){var b=typeof a=="string"&&a||a&&a._lang||null;return b?g[b]||O(b):c}function Q(a){return D[a]?"'+("+D[a]+")+'":a.replace(n,"").replace(/\\?'/g,"\\'")}function R(a){return P().longDateFormat[a]||a}function S(a){var b="var a,b;return '"+a.replace(l,Q)+"';",c=Function;return new c("t","v","o","p","m",b)}function T(a){return C[a]||(C[a]=S(a)),C[a]}function U(a,b){function d(d,e){return c[d].call?c[d](a,b):c[d][e]}var c=P(a);while(m.test(b))b=b.replace(m,R);return C[b]||(C[b]=S(b)),C[b](a,d,c.ordinal,J,c.meridiem)}function V(a){switch(a){case"DDDD":return r;case"YYYY":return s;case"S":case"SS":case"SSS":case"DDD":return q;case"MMM":case"MMMM":case"dd":case"ddd":case"dddd":case"a":case"A":return t;case"Z":case"ZZ":return u;case"T":return v;case"MM":case"DD":case"YY":case"HH":case"hh":case"mm":case"ss":case"M":case"D":case"d":case"H":case"h":case"m":case"s":return p;default:return new RegExp(a.replace("\\",""))}}function W(a,b,c,d){var e;switch(a){case"M":case"MM":c[1]=b==null?0:~~b-1;break;case"MMM":case"MMMM":for(e=0;e<12;e++)if(P().monthsParse[e].test(b)){c[1]=e;break}break;case"D":case"DD":case"DDD":case"DDDD":b!=null&&(c[2]=~~b);break;case"YY":b=~~b,c[0]=b+(b>70?1900:2e3);break;case"YYYY":c[0]=~~Math.abs(b);break;case"a":case"A":d.isPm=(b+"").toLowerCase()==="pm";break;case"H":case"HH":case"h":case"hh":c[3]=~~b;break;case"m":case"mm":c[4]=~~b;break;case"s":case"ss":c[5]=~~b;break;case"S":case"SS":case"SSS":c[6]=~~(("0."+b)*1e3);break;case"Z":case"ZZ":d.isUTC=!0,e=(b+"").match(z),e&&e[1]&&(d.tzh=~~e[1]),e&&e[2]&&(d.tzm=~~e[2]),e&&e[0]==="+"&&(d.tzh=-d.tzh,d.tzm=-d.tzm)}}function X(a,b){var c=[0,0,1,0,0,0,0],d={tzh:0,tzm:0},e=b.match(l),f,g;for(f=0;f<e.length;f++)g=(V(e[f]).exec(a)||[])[0],a=a.replace(V(e[f]),""),W(e[f],g,c,d);return d.isPm&&c[3]<12&&(c[3]+=12),d.isPm===!1&&c[3]===12&&(c[3]=0),c[3]+=d.tzh,c[4]+=d.tzm,N(c,d.isUTC)}function Y(a,b){var c,d=a.match(o)||[],e,f=99,g,h,i;for(g=0;g<b.length;g++)h=X(a,b[g]),e=U(new G(h),b[g]).match(o)||[],i=M(d,e),i<f&&(f=i,c=h);return c}function Z(b){var c="YYYY-MM-DDT",d;if(w.exec(b)){for(d=0;d<4;d++)if(y[d][1].exec(b)){c+=y[d][0];break}return u.exec(b)?X(b,c+" Z"):X(b,c)}return new a(b)}function $(a,b,c,d,e){var f=e.relativeTime[a];return typeof f=="function"?f(b||1,!!c,a,d):f.replace(/%d/i,b||1)}function _(a,b,c){var d=e(Math.abs(a)/1e3),f=e(d/60),g=e(f/60),h=e(g/24),i=e(h/365),j=d<45&&["s",d]||f===1&&["m"]||f<45&&["mm",f]||g===1&&["h"]||g<22&&["hh",g]||h===1&&["d"]||h<=25&&["dd",h]||h<=45&&["M"]||h<345&&["MM",e(h/30)]||i===1&&["y"]||["yy",i];return j[2]=b,j[3]=a>0,j[4]=c,$.apply({},j)}function ab(a,b){c.fn[a]=function(a){var c=this._isUTC?"UTC":"";return a!=null?(this._d["set"+c+b](a),this):this._d["get"+c+b]()}}function bb(a){c.duration.fn[a]=function(){return this._data[a]}}function cb(a,b){c.duration.fn["as"+a]=function(){return+this/b}}var c,d="1.7.0",e=Math.round,f,g={},h="en",i=typeof module!="undefined"&&module.exports,j="months|monthsShort|weekdays|weekdaysShort|weekdaysMin|longDateFormat|calendar|relativeTime|ordinal|meridiem".split("|"),k=/^\/?Date\((\-?\d+)/i,l=/(\[[^\[]*\])|(\\)?(Mo|MM?M?M?|Do|DDDo|DD?D?D?|ddd?d?|do?|w[o|w]?|YYYY|YY|a|A|hh?|HH?|mm?|ss?|SS?S?|zz?|ZZ?)/g,m=/(LT|LL?L?L?)/g,n=/(^\[)|(\\)|\]$/g,o=/([0-9a-zA-Z\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]+)/gi,p=/\d\d?/,q=/\d{1,3}/,r=/\d{3}/,s=/\d{1,4}/,t=/[0-9a-z\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]+/i,u=/Z|[\+\-]\d\d:?\d\d/i,v=/T/i,w=/^\s*\d{4}-\d\d-\d\d(T(\d\d(:\d\d(:\d\d(\.\d\d?\d?)?)?)?)?([\+\-]\d\d:?\d\d)?)?/,x="YYYY-MM-DDTHH:mm:ssZ",y=[["HH:mm:ss.S",/T\d\d:\d\d:\d\d\.\d{1,3}/],["HH:mm:ss",/T\d\d:\d\d:\d\d/],["HH:mm",/T\d\d:\d\d/],["HH",/T\d\d/]],z=/([\+\-]|\d\d)/gi,A="Month|Date|Hours|Minutes|Seconds|Milliseconds".split("|"),B={Milliseconds:1,Seconds:1e3,Minutes:6e4,Hours:36e5,Days:864e5,Months:2592e6,Years:31536e6},C={},D={M:"(a=t.month()+1)",MMM:'v("monthsShort",t.month())',MMMM:'v("months",t.month())',D:"(a=t.date())",DDD:"(a=new Date(t.year(),t.month(),t.date()),b=new Date(t.year(),0,1),a=~~(((a-b)/864e5)+1.5))",d:"(a=t.day())",dd:'v("weekdaysMin",t.day())',ddd:'v("weekdaysShort",t.day())',dddd:'v("weekdays",t.day())',w:"(a=new Date(t.year(),t.month(),t.date()-t.day()+5),b=new Date(a.getFullYear(),0,4),a=~~((a-b)/864e5/7+1.5))",YY:"p(t.year()%100,2)",YYYY:"p(t.year(),4)",a:"m(t.hours(),t.minutes(),!0)",A:"m(t.hours(),t.minutes(),!1)",H:"t.hours()",h:"t.hours()%12||12",m:"t.minutes()",s:"t.seconds()",S:"~~(t.milliseconds()/100)",SS:"p(~~(t.milliseconds()/10),2)",SSS:"p(t.milliseconds(),3)",Z:'((a=-t.zone())<0?((a=-a),"-"):"+")+p(~~(a/60),2)+":"+p(~~a%60,2)',ZZ:'((a=-t.zone())<0?((a=-a),"-"):"+")+p(~~(10*a/6),4)'},E="DDD w M D d".split(" "),F="M D H h m s w".split(" ");while(E.length)f=E.pop(),D[f+"o"]=D[f]+"+o(a)";while(F.length)f=F.pop(),D[f+f]="p("+D[f]+",2)";D.DDDD="p("+D.DDD+",3)",c=function(d,e){if(d===null||d==="")return null;var f,g;return c.isMoment(d)?new G(new a(+d._d),d._isUTC,d._lang):(e?L(e)?f=Y(d,e):f=X(d,e):(g=k.exec(d),f=d===b?new a:g?new a(+g[1]):d instanceof a?d:L(d)?N(d):typeof d=="string"?Z(d):new a(d)),new G(f))},c.utc=function(a,b){return L(a)?new G(N(a,!0),!0):(typeof a=="string"&&!u.exec(a)&&(a+=" +0000",b&&(b+=" Z")),c(a,b).utc())},c.unix=function(a){return c(a*1e3)},c.duration=function(a,b){var d=c.isDuration(a),e=typeof a=="number",f=d?a._data:e?{}:a,g;return e&&(b?f[b]=a:f.milliseconds=a),g=new H(f),d&&(g._lang=a._lang),g},c.humanizeDuration=function(a,b,d){return c.duration(a,b===!0?null:b).humanize(b===!0?!0:d)},c.version=d,c.defaultFormat=x,c.lang=function(a,b){var d;if(!a)return h;(b||!g[a])&&O(a,b);if(g[a]){for(d=0;d<j.length;d++)c[j[d]]=g[a][j[d]];c.monthsParse=g[a].monthsParse,h=a}},c.langData=P,c.isMoment=function(a){return a instanceof G},c.isDuration=function(a){return a instanceof H},c.lang("en",{months:"January_February_March_April_May_June_July_August_September_October_November_December".split("_"),monthsShort:"Jan_Feb_Mar_Apr_May_Jun_Jul_Aug_Sep_Oct_Nov_Dec".split("_"),weekdays:"Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday".split("_"),weekdaysShort:"Sun_Mon_Tue_Wed_Thu_Fri_Sat".split("_"),weekdaysMin:"Su_Mo_Tu_We_Th_Fr_Sa".split("_"),longDateFormat:{LT:"h:mm A",L:"MM/DD/YYYY",LL:"MMMM D YYYY",LLL:"MMMM D YYYY LT",LLLL:"dddd, MMMM D YYYY LT"},meridiem:function(a,b,c){return a>11?c?"pm":"PM":c?"am":"AM"},calendar:{sameDay:"[Today at] LT",nextDay:"[Tomorrow at] LT",nextWeek:"dddd [at] LT",lastDay:"[Yesterday at] LT",lastWeek:"[last] dddd [at] LT",sameElse:"L"},relativeTime:{future:"in %s",past:"%s ago",s:"a few seconds",m:"a minute",mm:"%d minutes",h:"an hour",hh:"%d hours",d:"a day",dd:"%d days",M:"a month",MM:"%d months",y:"a year",yy:"%d years"},ordinal:function(a){var b=a%10;return~~(a%100/10)===1?"th":b===1?"st":b===2?"nd":b===3?"rd":"th"}}),c.fn=G.prototype={clone:function(){return c(this)},valueOf:function(){return+this._d},unix:function(){return Math.floor(+this._d/1e3)},toString:function(){return this._d.toString()},toDate:function(){return this._d},toArray:function(){var a=this;return[a.year(),a.month(),a.date(),a.hours(),a.minutes(),a.seconds(),a.milliseconds(),!!this._isUTC]},isValid:function(){return this._a?!M(this._a,(this._a[7]?c.utc(this):this).toArray()):!isNaN(this._d.getTime())},utc:function(){return this._isUTC=!0,this},local:function(){return this._isUTC=!1,this},format:function(a){return U(this,a?a:c.defaultFormat)},add:function(a,b){var d=b?c.duration(+b,a):c.duration(a);return K(this,d,1),this},subtract:function(a,b){var d=b?c.duration(+b,a):c.duration(a);return K(this,d,-1),this},diff:function(a,b,d){var f=this._isUTC?c(a).utc():c(a).local(),g=(this.zone()-f.zone())*6e4,h=this._d-f._d-g,i=this.year()-f.year(),j=this.month()-f.month(),k=this.date()-f.date(),l;return b==="months"?l=i*12+j+k/30:b==="years"?l=i+(j+k/30)/12:l=b==="seconds"?h/1e3:b==="minutes"?h/6e4:b==="hours"?h/36e5:b==="days"?h/864e5:b==="weeks"?h/6048e5:h,d?l:e(l)},from:function(a,b){return c.duration(this.diff(a)).lang(this._lang).humanize(!b)},fromNow:function(a){return this.from(c(),a)},calendar:function(){var a=this.diff(c().sod(),"days",!0),b=this.lang().calendar,d=b.sameElse,e=a<-6?d:a<-1?b.lastWeek:a<0?b.lastDay:a<1?b.sameDay:a<2?b.nextDay:a<7?b.nextWeek:d;return this.format(typeof e=="function"?e.apply(this):e)},isLeapYear:function(){var a=this.year();return a%4===0&&a%100!==0||a%400===0},isDST:function(){return this.zone()<c([this.year()]).zone()||this.zone()<c([this.year(),5]).zone()},day:function(a){var b=this._isUTC?this._d.getUTCDay():this._d.getDay();return a==null?b:this.add({d:a-b})},startOf:function(a){switch(a.replace(/s$/,"")){case"year":this.month(0);case"month":this.date(1);case"day":this.hours(0);case"hour":this.minutes(0);case"minute":this.seconds(0);case"second":this.milliseconds(0)}return this},endOf:function(a){return this.startOf(a).add(a.replace(/s?$/,"s"),1).subtract("ms",1)},sod:function(){return this.clone().startOf("day")},eod:function(){return this.clone().endOf("day")},zone:function(){return this._isUTC?0:this._d.getTimezoneOffset()},daysInMonth:function(){return c.utc([this.year(),this.month()+1,0]).date()},lang:function(a){return a===b?P(this):(this._lang=a,this)}};for(f=0;f<A.length;f++)ab(A[f].toLowerCase(),A[f]);ab("year","FullYear"),c.duration.fn=H.prototype={weeks:function(){return I(this.days()/7)},valueOf:function(){return this._milliseconds+this._days*864e5+this._months*2592e6},humanize:function(a){var b=+this,c=this.lang().relativeTime,d=_(b,!a,this.lang());return a&&(d=(b<=0?c.past:c.future).replace(/%s/i,d)),d},lang:c.fn.lang};for(f in B)B.hasOwnProperty(f)&&(cb(f,B[f]),bb(f.toLowerCase()));cb("Weeks",6048e5),i&&(module.exports=c),typeof ender=="undefined"&&(this.moment=c),typeof define=="function"&&define.amd&&define("moment",[],function(){return c})}).call(this,Date);(function(a){(function(a){science={version:"1.9.1"},science.ascending=function(a,b){return a-b},science.EULER=.5772156649015329,science.expm1=function(a){return a<1e-5&&a>-0.00001?a+.5*a*a:Math.exp(a)-1},science.functor=function(a){return typeof a=="function"?a:function(){return a}},science.hypot=function(a,b){a=Math.abs(a),b=Math.abs(b);var c,d;a>b?(c=a,d=b):(c=b,d=a);var e=d/c;return c*Math.sqrt(1+e*e)},science.quadratic=function(){function b(b,c,d){var e=c*c-4*b*d;return e>0?(e=Math.sqrt(e)/(2*b),a?[{r:-c-e,i:0},{r:-c+e,i:0}]:[-c-e,-c+e]):e===0?(e=-c/(2*b),a?[{r:e,i:0}]:[e]):a?(e=Math.sqrt(-e)/(2*b),[{r:-c,i:-e},{r:-c,i:e}]):[]}var a=!1;return b.complex=function(c){return arguments.length?(a=c,b):a},b},science.zeroes=function(a){var b=-1,c=[];if(arguments.length===1)while(++b<a)c[b]=0;else while(++b<a)c[b]=science.zeroes.apply(this,Array.prototype.slice.call(arguments,1));return c}})(this),function(a){function b(a,b,c){var d=c.length;for(var e=0;e<d;e++)a[e]=c[d-1][e];for(var f=d-1;f>0;f--){var g=0,h=0;for(var i=0;i<f;i++)g+=Math.abs(a[i]);if(g===0){b[f]=a[f-1];for(var e=0;e<f;e++)a[e]=c[f-1][e],c[f][e]=0,c[e][f]=0}else{for(var i=0;i<f;i++)a[i]/=g,h+=a[i]*a[i];var j=a[f-1],k=Math.sqrt(h);j>0&&(k=-k),b[f]=g*k,h-=j*k,a[f-1]=j-k;for(var e=0;e<f;e++)b[e]=0;for(var e=0;e<f;e++){j=a[e],c[e][f]=j,k=b[e]+c[e][e]*j;for(var i=e+1;i<=f-1;i++)k+=c[i][e]*a[i],b[i]+=c[i][e]*j;b[e]=k}j=0;for(var e=0;e<f;e++)b[e]/=h,j+=b[e]*a[e];var l=j/(h+h);for(var e=0;e<f;e++)b[e]-=l*a[e];for(var e=0;e<f;e++){j=a[e],k=b[e];for(var i=e;i<=f-1;i++)c[i][e]-=j*b[i]+k*a[i];a[e]=c[f-1][e],c[f][e]=0}}a[f]=h}for(var f=0;f<d-1;f++){c[d-1][f]=c[f][f],c[f][f]=1;var h=a[f+1];if(h!=0){for(var i=0;i<=f;i++)a[i]=c[i][f+1]/h;for(var e=0;e<=f;e++){var k=0;for(var i=0;i<=f;i++)k+=c[i][f+1]*c[i][e];for(var i=0;i<=f;i++)c[i][e]-=k*a[i]}}for(var i=0;i<=f;i++)c[i][f+1]=0}for(var e=0;e<d;e++)a[e]=c[d-1][e],c[d-1][e]=0;c[d-1][d-1]=1,b[0]=0}function c(a,b,c){var d=c.length;for(var e=1;e<d;e++)b[e-1]=b[e];b[d-1]=0;var f=0,g=0,h=1e-12;for(var i=0;i<d;i++){g=Math.max(g,Math.abs(a[i])+Math.abs(b[i]));var j=i;while(j<d){if(Math.abs(b[j])<=h*g)break;j++}if(j>i){var k=0;do{k++;var l=a[i],m=(a[i+1]-l)/(2*b[i]),n=science.hypot(m,1);m<0&&(n=-n),a[i]=b[i]/(m+n),a[i+1]=b[i]*(m+n);var o=a[i+1],p=l-a[i];for(var e=i+2;e<d;e++)a[e]-=p;f+=p,m=a[j];var q=1,r=q,s=q,t=b[i+1],u=0,v=0;for(var e=j-1;e>=i;e--){s=r,r=q,v=u,l=q*b[e],p=q*m,n=science.hypot(m,b[e]),b[e+1]=u*n,u=b[e]/n,q=m/n,m=q*a[e]-u*l,a[e+1]=p+u*(q*l+u*a[e]);for(var w=0;w<d;w++)p=c[w][e+1],c[w][e+1]=u*c[w][e]+q*p,c[w][e]=q*c[w][e]-u*p}m=-u*v*s*t*b[i]/o,b[i]=u*m,a[i]=q*m}while(Math.abs(b[i])>h*g)}a[i]=a[i]+f,b[i]=0}for(var e=0;e<d-1;e++){var w=e,m=a[e];for(var x=e+1;x<d;x++)a[x]<m&&(w=x,m=a[x]);if(w!=e){a[w]=a[e],a[e]=m;for(var x=0;x<d;x++)m=c[x][e],c[x][e]=c[x][w],c[x][w]=m}}}function d(a,b){var c=a.length,d=[],e=0,f=c-1;for(var g=e+1;g<f;g++){var h=0;for(var i=g;i<=f;i++)h+=Math.abs(a[i][g-1]);if(h!==0){var j=0;for(var i=f;i>=g;i--)d[i]=a[i][g-1]/h,j+=d[i]*d[i];var k=Math.sqrt(j);d[g]>0&&(k=-k),j-=d[g]*k,d[g]=d[g]-k;for(var l=g;l<c;l++){var m=0;for(var i=f;i>=g;i--)m+=d[i]*a[i][l];m/=j;for(var i=g;i<=f;i++)a[i][l]-=m*d[i]}for(var i=0;i<=f;i++){var m=0;for(var l=f;l>=g;l--)m+=d[l]*a[i][l];m/=j;for(var l=g;l<=f;l++)a[i][l]-=m*d[l]}d[g]=h*d[g],a[g][g-1]=h*k}}for(var i=0;i<c;i++)for(var l=0;l<c;l++)b[i][l]=i===l?1:0;for(var g=f-1;g>=e+1;g--)if(a[g][g-1]!==0){for(var i=g+1;i<=f;i++)d[i]=a[i][g-1];for(var l=g;l<=f;l++){var k=0;for(var i=g;i<=f;i++)k+=d[i]*b[i][l];k=k/d[g]/a[g][g-1];for(var i=g;i<=f;i++)b[i][l]+=k*d[i]}}}function e(a,b,c,d){var e=c.length,g=e-1,h=0,i=e-1,j=1e-12,k=0,l=0,m=0,n=0,o=0,p=0,q,r,s,t,u=0;for(var v=0;v<e;v++){if(v<h||v>i)a[v]=c[v][v],b[v]=0;for(var w=Math.max(v-1,0);w<e;w++)u+=Math.abs(c[v][w])}var x=0;while(g>=h){var y=g;while(y>h){o=Math.abs(c[y-1][y-1])+Math.abs(c[y][y]),o===0&&(o=u);if(Math.abs(c[y][y-1])<j*o)break;y--}if(y===g)c[g][g]=c[g][g]+k,a[g]=c[g][g],b[g]=0,g--,x=0;else if(y===g-1){r=c[g][g-1]*c[g-1][g],l=(c[g-1][g-1]-c[g][g])/2,m=l*l+r,p=Math.sqrt(Math.abs(m)),c[g][g]=c[g][g]+k,c[g-1][g-1]=c[g-1][g-1]+k,s=c[g][g];if(m>=0){p=l+(l>=0?p:-p),a[g-1]=s+p,a[g]=a[g-1],p!==0&&(a[g]=s-r/p),b[g-1]=0,b[g]=0,s=c[g][g-1],o=Math.abs(s)+Math.abs(p),l=s/o,m=p/o,n=Math.sqrt(l*l+m*m),l/=n,m/=n;for(var w=g-1;w<e;w++)p=c[g-1][w],c[g-1][w]=m*p+l*c[g][w],c[g][w]=m*c[g][w]-l*p;for(var v=0;v<=g;v++)p=c[v][g-1],c[v][g-1]=m*p+l*c[v][g],c[v][g]=m*c[v][g]-l*p;for(var v=h;v<=i;v++)p=d[v][g-1],d[v][g-1]=m*p+l*d[v][g],d[v][g]=m*d[v][g]-l*p}else a[g-1]=s+l,a[g]=s+l,b[g-1]=p,b[g]=-p;g-=2,x=0}else{s=c[g][g],t=0,r=0,y<g&&(t=c[g-1][g-1],r=c[g][g-1]*c[g-1][g]);if(x==10){k+=s;for(var v=h;v<=g;v++)c[v][v]-=s;o=Math.abs(c[g][g-1])+Math.abs(c[g-1][g-2]),s=t=.75*o,r=-0.4375*o*o}if(x==30){o=(t-s)/2,o=o*o+r;if(o>0){o=Math.sqrt(o),t<s&&(o=-o),o=s-r/((t-s)/2+o);for(var v=h;v<=g;v++)c[v][v]-=o;k+=o,s=t=r=.964}}x++;var z=g-2;while(z>=y){p=c[z][z],n=s-p,o=t-p,l=(n*o-r)/c[z+1][z]+c[z][z+1],m=c[z+1][z+1]-p-n-o,n=c[z+2][z+1],o=Math.abs(l)+Math.abs(m)+Math.abs(n),l/=o,m/=o,n/=o;if(z==y)break;if(Math.abs(c[z][z-1])*(Math.abs(m)+Math.abs(n))<j*Math.abs(l)*(Math.abs(c[z-1][z-1])+Math.abs(p)+Math.abs(c[z+1][z+1])))break;z--}for(var v=z+2;v<=g;v++)c[v][v-2]=0,v>z+2&&(c[v][v-3]=0);for(var A=z;A<=g-1;A++){var B=A!=g-1;A!=z&&(l=c[A][A-1],m=c[A+1][A-1],n=B?c[A+2][A-1]:0,s=Math.abs(l)+Math.abs(m)+Math.abs(n),s!=0&&(l/=s,m/=s,n/=s));if(s==0)break;o=Math.sqrt(l*l+m*m+n*n),l<0&&(o=-o);if(o!=0){A!=z?c[A][A-1]=-o*s:y!=z&&(c[A][A-1]=-c[A][A-1]),l+=o,s=l/o,t=m/o,p=n/o,m/=l,n/=l;for(var w=A;w<e;w++)l=c[A][w]+m*c[A+1][w],B&&(l+=n*c[A+2][w],c[A+2][w]=c[A+2][w]-l*p),c[A][w]=c[A][w]-l*s,c[A+1][w]=c[A+1][w]-l*t;for(var v=0;v<=Math.min(g,A+3);v++)l=s*c[v][A]+t*c[v][A+1],B&&(l+=p*c[v][A+2],c[v][A+2]=c[v][A+2]-l*n),c[v][A]=c[v][A]-l,c[v][A+1]=c[v][A+1]-l*m;for(var v=h;v<=i;v++)l=s*d[v][A]+t*d[v][A+1],B&&(l+=p*d[v][A+2],d[v][A+2]=d[v][A+2]-l*n),d[v][A]=d[v][A]-l,d[v][A+1]=d[v][A+1]-l*m}}}}if(u==0)return;for(g=e-1;g>=0;g--){l=a[g],m=b[g];if(m==0){var y=g;c[g][g]=1;for(var v=g-1;v>=0;v--){r=c[v][v]-l,n=0;for(var w=y;w<=g;w++)n+=c[v][w]*c[w][g];if(b[v]<0)p=r,o=n;else{y=v,b[v]===0?c[v][g]=-n/(r!==0?r:j*u):(s=c[v][v+1],t=c[v+1][v],m=(a[v]-l)*(a[v]-l)+b[v]*b[v],q=(s*o-p*n)/m,c[v][g]=q,Math.abs(s)>Math.abs(p)?c[v+1][g]=(-n-r*q)/s:c[v+1][g]=(-o-t*q)/p),q=Math.abs(c[v][g]);if(j*q*q>1)for(var w=v;w<=g;w++)c[w][g]=c[w][g]/q}}}else if(m<0){var y=g-1;if(Math.abs(c[g][g-1])>Math.abs(c[g-1][g]))c[g-1][g-1]=m/c[g][g-1],c[g-1][g]=-(c[g][g]-l)/c[g][g-1];else{var C=f(0,-c[g-1][g],c[g-1][g-1]-l,m);c[g-1][g-1]=C[0],c[g-1][g]=C[1]}c[g][g-1]=0,c[g][g]=1;for(var v=g-2;v>=0;v--){var D=0,E=0,F,G;for(var w=y;w<=g;w++)D+=c[v][w]*c[w][g-1],E+=c[v][w]*c[w][g];r=c[v][v]-l;if(b[v]<0)p=r,n=D,o=E;else{y=v;if(b[v]==0){var C=f(-D,-E,r,m);c[v][g-1]=C[0],c[v][g]=C[1]}else{s=c[v][v+1],t=c[v+1][v],F=(a[v]-l)*(a[v]-l)+b[v]*b[v]-m*m,G=(a[v]-l)*2*m,F==0&G==0&&(F=j*u*(Math.abs(r)+Math.abs(m)+Math.abs(s)+Math.abs(t)+Math.abs(p)));var C=f(s*n-p*D+m*E,s*o-p*E-m*D,F,G);c[v][g-1]=C[0],c[v][g]=C[1];if(Math.abs(s)>Math.abs(p)+Math.abs(m))c[v+1][g-1]=(-D-r*c[v][g-1]+m*c[v][g])/s,c[v+1][g]=(-E-r*c[v][g]-m*c[v][g-1])/s;else{var C=f(-n-t*c[v][g-1],-o-t*c[v][g],p,m);c[v+1][g-1]=C[0],c[v+1][g]=C[1]}}q=Math.max(Math.abs(c[v][g-1]),Math.abs(c[v][g]));if(j*q*q>1)for(var w=v;w<=g;w++)c[w][g-1]=c[w][g-1]/q,c[w][g]=c[w][g]/q}}}}for(var v=0;v<e;v++)if(v<h||v>i)for(var w=v;w<e;w++)d[v][w]=c[v][w];for(var w=e-1;w>=h;w--)for(var v=h;v<=i;v++){p=0;for(var A=h;A<=Math.min(w,i);A++)p+=d[v][A]*c[A][w];d[v][w]=p}}function f(a,b,c,d){if(Math.abs(c)>Math.abs(d)){var e=d/c,f=c+e*d;return[(a+e*b)/f,(b-e*a)/f]}var e=c/d,f=d+e*c;return[(e*a+b)/f,(e*b-a)/f]}science.lin={},science.lin.decompose=function(){function a(a){var f=a.length,g=[],h=[],i=[];for(var j=0;j<f;j++)g[j]=[],h[j]=[],i[j]=[];var k=!0;for(var l=0;l<f;l++)for(var j=0;j<f;j++)if(a[j][l]!==a[l][j]){k=!1;break}if(k){for(var j=0;j<f;j++)g[j]=a[j].slice();b(h,i,g),c(h,i,g)}else{var m=[];for(var j=0;j<f;j++)m[j]=a[j].slice();d(m,g),e(h,i,m,g)}var n=[];for(var j=0;j<f;j++){var o=n[j]=[];for(var l=0;l<f;l++)o[l]=j===l?h[j]:0;n[j][i[j]>0?j+1:j-1]=i[j]}return{D:n,V:g}}return a},science.lin.cross=function(a,b){return[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]]},science.lin.dot=function(a,b){var c=0,d=-1,e=Math.min(a.length,b.length);while(++d<e)c+=a[d]*b[d];return c},science.lin.length=function(a){return Math.sqrt(science.lin.dot(a,a))},science.lin.normalize=function(a){var b=science.lin.length(a);return a.map(function(a){return a/b})},science.lin.determinant=function(a){var b=a[0].concat(a[1]).concat(a[2]).concat(a[3]);return b[12]*b[9]*b[6]*b[3]-b[8]*b[13]*b[6]*b[3]-b[12]*b[5]*b[10]*b[3]+b[4]*b[13]*b[10]*b[3]+b[8]*b[5]*b[14]*b[3]-b[4]*b[9]*b[14]*b[3]-b[12]*b[9]*b[2]*b[7]+b[8]*b[13]*b[2]*b[7]+b[12]*b[1]*b[10]*b[7]-b[0]*b[13]*b[10]*b[7]-b[8]*b[1]*b[14]*b[7]+b[0]*b[9]*b[14]*b[7]+b[12]*b[5]*b[2]*b[11]-b[4]*b[13]*b[2]*b[11]-b[12]*b[1]*b[6]*b[11]+b[0]*b[13]*b[6]*b[11]+b[4]*b[1]*b[14]*b[11]-b[0]*b[5]*b[14]*b[11]-b[8]*b[5]*b[2]*b[15]+b[4]*b[9]*b[2]*b[15]+b[8]*b[1]*b[6]*b[15]-b[0]*b[9]*b[6]*b[15]-b[4]*b[1]*b[10]*b[15]+b[0]*b[5]*b[10]*b[15]},science.lin.gaussjordan=function(a,b){b||(b=1e-10);var c=a.length,d=a[0].length,e=-1,f,g;while(++e<c){var h=e;f=e;while(++f<c)Math.abs(a[f][e])>Math.abs(a[h][e])&&(h=f);var i=a[e];a[e]=a[h],a[h]=i;if(Math.abs(a[e][e])<=b)return!1;f=e;while(++f<c){var j=a[f][e]/a[e][e];g=e-1;while(++g<d)a[f][g]-=a[e][g]*j}}e=c;while(--e>=0){var j=a[e][e];f=-1;while(++f<e){g=d;while(--g>=e)a[f][g]-=a[e][g]*a[f][e]/j}a[e][e]/=j,g=c-1;while(++g<d)a[e][g]/=j}return!0},science.lin.inverse=function(a){var b=a.length,c=-1;if(b!==a[0].length)return;a=a.map(function(a,c){var d=new Array(b),e=-1;while(++e<b)d[e]=c===e?1:0;return a.concat(d)}),science.lin.gaussjordan(a);while(++c<b)a[c]=a[c].slice(b);return a},science.lin.multiply=function(a,b){var c=a.length,d=b[0].length,e=b.length,f=-1,g,h;if(e!==a[0].length)throw{error:"columns(a) != rows(b); "+a[0].length+" != "+e};var i=new Array(c);while(++f<c){i[f]=new Array(d),g=-1;while(++g<d){var j=0;h=-1;while(++h<e)j+=a[f][h]*b[h][g];i[f][g]=j}}return i},science.lin.transpose=function(a){var b=a.length,c=a[0].length,d=-1,e,f=new Array(c);while(++d<c){f[d]=new Array(b),e=-1;while(++e<b)f[d][e]=a[e][d]}return f},science.lin.tridag=function(a,b,c,d,e,f){var g,h;for(g=1;g<f;g++)h=a[g]/b[g-1],b[g]-=h*c[g-1],d[g]-=h*d[g-1];e[f-1]=d[f-1]/b[f-1];for(g=f-2;g>=0;g--)e[g]=(d[g]-c[g]*e[g+1])/b[g]}}(this),function(a){function b(a,b){if(!a||!b||a.length!==b.length)return!1;var c=a.length,d=-1;while(++d<c)if(a[d]!==b[d])return!1;return!0}function c(a,c){var d=c.length;if(a>d)return null;var e=[],f=[],g={},h=0,i=0,j,k,l;while(i<a){if(h===d)return null;var m=Math.floor(Math.random()*d);if(m in g)continue;g[m]=1,h++,k=c[m],l=!0;for(j=0;j<i;j++)if(b(k,e[j])){l=!1;break}l&&(e[i]=k,f[i]=m,i++)}return e}function d(a,b,c,d){var e=[],f=a+c,g=b.length,h=-1;while(++h<g)e[h]=(a*b[h]+c*d[h])/f;return e}function e(a){var b=a.length,c=-1;while(++c<b)if(!isFinite(a[c]))return!1;return!0}function f(a){var b=a.length,c=0;while(++c<b)if(a[c-1]>=a[c])return!1;return!0}function g(a){return(a=1-a*a*a)*a*a}function h(a,b,c,d){var e=d[0],f=d[1],g=i(b,f);if(g<a.length&&a[g]-a[c]<a[c]-a[e]){var h=i(b,e);d[0]=h,d[1]=g}}function i(a,b){var c=b+1;while(c<a.length&&a[c]===0)c++;return c}science.stats={},science.stats.bandwidth={nrd0:function(a){var b=Math.sqrt(science.stats.variance(a));return(lo=Math.min(b,science.stats.iqr(a)/1.34))||(lo=b)||(lo=Math.abs(a[1]))||(lo=1),.9*lo*Math.pow(a.length,-0.2)},nrd:function(a){var b=science.stats.iqr(a)/1.34;return 1.06*Math.min(Math.sqrt(science.stats.variance(a)),b)*Math.pow(a.length,-0.2)}},science.stats.distance={euclidean:function(a,b){var c=a.length,d=-1,e=0,f;while(++d<c)f=a[d]-b[d],e+=f*f;return Math.sqrt(e)},manhattan:function(a,b){var c=a.length,d=-1,e=0;while(++d<c)e+=Math.abs(a[d]-b[d]);return e},minkowski:function(a){return function(b,c){var d=b.length,e=-1,f=0;while(++e<d)f+=Math.pow(Math.abs(b[e]-c[e]),a);return Math.pow(f,1/a)}},chebyshev:function(a,b){var c=a.length,d=-1,e=0,f;while(++d<c)f=Math.abs(a[d]-b[d]),f>e&&(e=f);return e},hamming:function(a,b){var c=a.length,d=-1,e=0;while(++d<c)a[d]!==b[d]&&e++;return e},jaccard:function(a,b){var c=a.length,d=-1,e=0;while(++d<c)a[d]===b[d]&&e++;return e/c},braycurtis:function(a,b){var c=a.length,d=-1,e=0,f=0,g,h;while(++d<c)g=a[d],h=b[d],e+=Math.abs(g-h),f+=Math.abs(g+h);return e/f}},science.stats.erf=function(a){var b=.254829592,c=-0.284496736,d=1.421413741,e=-1.453152027,f=1.061405429,g=.3275911,h=a<0?-1:1;a<0&&(h=-1,a=-a);var i=1/(1+g*a);return h*(1-((((f*i+e)*i+d)*i+c)*i+b)*i*Math.exp(-a*a))},science.stats.phi=function(a){return.5*(1+science.stats.erf(a/Math.SQRT2))},science.stats.kernel={uniform:function(a){return a<=1&&a>=-1?.5:0},triangular:function(a){return a<=1&&a>=-1?1-Math.abs(a):0},epanechnikov:function(a){return a<=1&&a>=-1?.75*(1-a*a):0},quartic:function(a){if(a<=1&&a>=-1){var b=1-a*a;return.9375*b*b}return 0},triweight:function(a){if(a<=1&&a>=-1){var b=1-a*a;return 35/32*b*b*b}return 0},gaussian:function(a){return 1/Math.sqrt(2*Math.PI)*Math.exp(-0.5*a*a)},cosine:function(a){return a<=1&&a>=-1?Math.PI/4*Math.cos(Math.PI/2*a):0}},science.stats.kde=function(){function d(d,e){var f=c.call(this,b);return d.map(function(c){var d=-1,e=0,g=b.length;while(++d<g)e+=a((c-b[d])/f);return[c,e/f/g]})}var a=science.stats.kernel.gaussian,b=[],c=science.stats.bandwidth.nrd;return d.kernel=function(b){return arguments.length?(a=b,d):a},d.sample=function(a){return arguments.length?(b=a,d):b},d.bandwidth=function(a){return arguments.length?(c=science.functor(a),d):c},d},science.stats.kmeans=function(){function f(f){var g=f.length,h=[],i=[],j=1,l=0,m=c(e,f),n,o,p,q,r,s,t;while(j&&l<d){p=-1;while(++p<e)i[p]=0;o=-1;while(++o<g){q=f[o],s=Infinity,p=-1;while(++p<e)r=a.call(this,m[p],q),r<s&&(s=r,t=p);i[h[o]=t]++}n=[],o=-1;while(++o<g){q=h[o],r=n[q];if(r==null)n[q]=f[o].slice();else{p=-1;while(++p<r.length)r[p]+=f[o][p]}}p=-1;while(++p<e){q=n[p],r=1/i[p],o=-1;while(++o<q.length)q[o]*=r}j=0,p=-1;while(++p<e)if(!b(n[p],m[p])){j=1;break}m=n,l++}return{assignments:h,centroids:m}}var a=science.stats.distance.euclidean,d=1e3,e=1;return f.k=function(a){return arguments.length?(e=a,f):e},f.distance=function(b){return arguments.length?(a=b,f):a},f},science.stats.hcluster=function(){function c(c){var e=c.length,f=[],g=[],h=[],i=[],j,k,l,m,n,o,p,q;p=-1;while(++p<e){f[p]=0,h[p]=[],q=-1;while(++q<e)h[p][q]=p===q?Infinity:a(c[p],c[q]),h[p][f[p]]>h[p][q]&&(f[p]=q)}p=-1;while(++p<e)i[p]=[],i[p][0]={left:null,right:null,dist:0,centroid:c[p],size:1,depth:0},g[p]=1;for(n=0;n<e-1;n++){j=0;for(p=0;p<e;p++)h[p][f[p]]<h[j][f[j]]&&(j=p);k=f[j],l=i[j][0],m=i[k][0];var r={left:l,right:m,dist:h[j][k],centroid:d(l.size,l.centroid,m.size,m.centroid),size:l.size+m.size,depth:1+Math.max(l.depth,m.depth)};i[j].splice(0,0,r),g[j]+=g[k];for(q=0;q<e;q++)switch(b){case"single":h[j][q]>h[k][q]&&(h[q][j]=h[j][q]=h[k][q]);break;case"complete":h[j][q]<h[k][q]&&(h[q][j]=h[j][q]=h[k][q]);break;case"average":h[q][j]=h[j][q]=(g[j]*h[j][q]+g[k]*h[k][q])/(g[j]+g[q])}h[j][j]=Infinity;for(p=0;p<e;p++)h[p][k]=h[k][p]=Infinity;for(q=0;q<e;q++)f[q]==k&&(f[q]=j),h[j][q]<h[j][f[j]]&&(f[j]=q);o=r}return o}var a=science.stats.distance.euclidean,b="simple";return c.distance=function(b){return arguments.length?(a=b,c):a},c},science.stats.iqr=function(a){var b=science.stats.quantiles(a,[.25,.75]);return b[1]-b[0]},science.stats.loess=function(){function d(d,i,j){var k=d.length,l;if(k!==i.length)throw{error:"Mismatched array lengths"};if(k==0)throw{error:"At least one point required."};if(arguments.length<3){j=[],l=-1;while(++l<k)j[l]=1}e(d),e(i),e(j),f(d);if(k==1)return[i[0]];if(k==2)return[i[0],i[1]];var m=Math.floor(a*k);if(m<2)throw{error:"Bandwidth too small."};var n=[],o=[],p=[];l=-1;while(++l<k)n[l]=0,o[l]=0,p[l]=1;var q=-1;while(++q<=b){var r=[0,m-1],s;l=-1;while(++l<k){s=d[l],l>0&&h(d,j,l,r);var t=r[0],u=r[1],v=d[l]-d[t]>d[u]-d[l]?t:u,w=0,x=0,y=0,z=0,A=0,B=Math.abs(1/(d[v]-s));for(var C=t;C<=u;++C){var D=d[C],E=i[C],F=C<l?s-D:D-s,G=g(F*B)*p[C]*j[C],H=D*G;w+=G,x+=H,y+=D*H,z+=E*G,A+=E*H}var I=x/w,J=z/w,K=A/w,L=y/w,M=Math.sqrt(Math.abs(L-I*I))<c?0:(K-I*J)/(L-I*I),N=J-M*I;n[l]=M*s+N,o[l]=Math.abs(i[l]-n[l])}if(q===b)break;var O=o.slice();O.sort();var P=O[Math.floor(k/2)];if(Math.abs(P)<c)break;var Q,G;l=-1;while(++l<k)Q=o[l]/(6*P),p[l]=Q>=1?0:(G=1-Q*Q)*G}return n}var a=.3,b=2,c=1e-12;return d.bandwidth=function(b){return arguments.length?(a=b,d):b},d.robustnessIterations=function(a){return arguments.length?(b=a,d):a},d.accuracy=function(a){return arguments.length?(c=a,d):a},d},science.stats.mean=function(a){var b=a.length;if(b===0)return NaN;var c=0,d=-1;while(++d<b)c+=(a[d]-c)/(d+1);return c},science.stats.median=function(a){return science.stats.quantiles(a,[.5])[0]},science.stats.mode=function(a){a=a.slice().sort(science.ascending);var b,c=a.length,d=-1,e=d,f=null,g=0,h,i;while(++d<c)(i=a[d])!==f&&((h=d-e)>g&&(g=h,b=f),f=i,e=d);return b},science.stats.quantiles=function(a,b){a=a.slice().sort(science.ascending);var c=a.length-1;return b.map(function(b){if(b===0)return a[0];if(b===1)return a[c];var d=1+b*c,e=Math.floor(d),f=d-e,g=a[e-1];return f===0?g:g+f*(a[e]-g)})},science.stats.variance=function(a){var b=a.length;if(b<1)return NaN;if(b===1)return 0;var c=science.stats.mean(a),d=-1,e=0;while(++d<b){var f=a[d]-c;e+=f*f}return e/(b-1)},science.stats.distribution={},science.stats.distribution.gaussian=function(){function e(){var d,e,f,g;do d=2*a()-1,e=2*a()-1,f=d*d+e*e;while(f>=1||f===0);return b+c*d*Math.sqrt(-2*Math.log(f)/f)}var a=Math.random,b=0,c=1,d=1;return e.pdf=function(a){return a=(a-mu)/c,science_stats_distribution_gaussianConstant*Math.exp(-0.5*a*a)/c},e.cdf=function(a){return a=(a-mu)/c,.5*(1+science.stats.erf(a/Math.SQRT2))},e.mean=function(a){return arguments.length?(b=+a,e):b},e.variance=function(a){return arguments.length?(c=Math.sqrt(d=+a),e):d},e.random=function(b){return arguments.length?(a=b,e):a},e},science_stats_distribution_gaussianConstant=1/Math.sqrt(2*Math.PI)}(this)})(this);/*global DBCollection: false, DBQuery: false */
/*jslint indent: 4, plusplus: true */
/**
 * MongoDB - distinct2.js
 * 
 *      Version: 1.1
 *         Date: September 24, 2012
 *      Project: http://skratchdot.com/projects/mongodb-distinct2/
 *  Source Code: https://github.com/skratchdot/mongodb-distinct2/
 *       Issues: https://github.com/skratchdot/mongodb-distinct2/issues/
 * Dependencies: MongoDB v1.8+
 * 
 * Description:
 * 
 * Similar to the db.myCollection.distinct() function, distinct2() allows
 * you to pass in an array of keys to get values for.  It also allows you
 * to pass in an optional "count" argument.  When true, you can easily get
 * the counts for your distinct values.
 * 
 * You can also call distinct2() on the results of a query (something you
 * can't currently do with the built in distinct() function).
 * 
 * To accomplish this, it adds the following functions to our built in mongo prototypes:  
 * 
 *     DBCollection.prototype.distinct2 = function (keys, count) {};
 *     DBQuery.prototype.distinct2 = function (keys, count) {};
 *
 * Usage:
 * 
 * // All 4 of these statements are the same as:
 * //
 * //     db.users.distinct('name.first')
 * //
 * db.users.distinct2('name.first');
 * db.users.distinct2('name.first', false);
 * db.users.distinct2(['name.first']);
 * db.users.distinct2(['name.first'], false);
 * 
 * // you can pass in an array of values
 * db.users.distinct2(['name.first','name.last']);
 * 
 * // you can get counts
 * db.users.distinct2('name.first', true);
 * 
 * // you can get distinct values from the results of a query
 * db.users.find({'name.first':'Bob'}).distinct('name.last');
 * 
 * 
 * 
 * 
 */
(function () {
	'use strict';

	var isArray, getFromKeyString;

	/**
	 * Same behavior as Array.isArray()
	 * @function
	 * @name isArray
	 * @private
	 * @param obj {*} The object to test
	 * @returns {boolean} Will return true of obj is an array, otherwise will return false
	 */
	isArray = function (obj) {
		return Object.prototype.toString.call(obj) === '[object Array]';
	};

	/**
	 * @function
	 * @name getFromKeyString
	 * @private
	 * @param obj {object} The object to search
	 * @param keyString {string} A dot delimited string path
	 * @returns {object|undefined} If we find the path provide by keyString, we will return the value at that path
	 */
	getFromKeyString = function (obj, keyString) {
		var arr, i;
		if (typeof keyString === 'string') {
			arr = keyString.split('.');
			for (i = 0; i < arr.length; i++) {
				if (obj && typeof obj === 'object' && obj.hasOwnProperty(arr[i])) {
					obj = obj[arr[i]];
				} else {
					return;
				}
			}
			return obj;
		}
	};

	/**
	 * @function
	 * @name distinct2
	 * @memberOf DBQuery
	 * @param keys {string|array} The array of dot delimited keys to get the distinct values for
	 * @param count {boolean} Whether or not to append
	 * @returns {array} If keys is a string, and count is false, then we behave like .distinct().
	 *                  If keys is a positive sized array, we will return an array of arrays.
	 *                  If count is true, we will return an array of arrays where the last value is the count.
	 */
	DBQuery.prototype.distinct2 = function (keys, count) {
		var i = 0,
			j = 0,
			addDataKey,
			returnArray = [],
			tempArray = [],
			arrayOfValues = false,
			data = {
				keys : [],
				countKeys : [],
				counts : {}
			};

		// our data object contains keys that are numbers, so data[0] is an array containing values
		addDataKey = function (key, value) {
			var index = data[key].indexOf(value);
			if (index < 0) {
				data[key].push(value);
				index = data[key].length - 1;
			}
			return index;
		};

		// if passed a string, convert it into an array
		if (typeof keys === 'string') {
			keys = [keys];
		}

		// if keys is not a positive sized array by now, do nothing
		if (!isArray(keys) || keys.length === 0) {
			return returnArray;
		}

		// init our data object. it contains: keys, counts, and a list of indexes
		for (i = 0; i < keys.length; i++) {
			data[i] = [];
			data.keys.push(keys[i]);
		}

		// populate data object
		this.forEach(function (obj) {
			var i, found = false, countKey, values = [], indices = [];
			for (i = 0; i < data.keys.length; i++) {
				values[i] = getFromKeyString(obj, data.keys[i]);
				indices[i] = addDataKey(i, values[i]);
				if (!found && 'undefined' !== typeof values[i]) {
					found = true;
				}
			}
			// add item to our data object
			if (found) {
				countKey = indices.join(',');
				if (!data.counts.hasOwnProperty(countKey)) {
					data.counts[countKey] = 0;
					data.countKeys.push(countKey);
				}
				if (count) {
					data.counts[countKey]++;
				}
			}
		});

		// should we return an array of values?
		if (keys.length === 1 && !count) {
			arrayOfValues = true;
		}

		// convert data object into returnArray
		for (i = 0; i < data.countKeys.length; i++) {
			if (arrayOfValues) { // we return an array of values
				returnArray.push(data[0][data.countKeys[i]]);
			} else { // we return an array of arrays
				tempArray = data.countKeys[i].split(',');
				for (j = 0; j < tempArray.length; j++) {
					tempArray[j] = data[j][tempArray[j]];
				}
				if (count) {
					tempArray.push(data.counts[data.countKeys[i]]);
				}
				returnArray.push(tempArray);
			}
		}

		return returnArray;
	};

	/**
	 * @function
	 * @name distinct2
	 * @memberOf DBCollection
	 * @param keys {string|array} The array of dot delimited keys to get the distinct values for
	 * @param count {boolean} Whether or not to append
	 * @returns {array} If keys is a string, and count is false, then we behave like .distinct().
	 *                  If keys is a positive sized array, we will return an array of arrays.
	 *                  If count is true, we will return an array of arrays where the last value is the count.
	 */
	DBCollection.prototype.distinct2 = function (keys, count) {
		var fields = {}, i;
		if (typeof keys === 'string') {
			keys = [keys];
		}
		if (!isArray(keys)) {
			keys = [];
		}
		for (i = 0; i < keys.length; i++) {
			fields[keys[i]] = 1;
		}
		return this.find({}, fields).distinct2(keys, count);
	};

}());/*global DBCollection: false, DBQuery: false */
/*jslint devel: false, nomen: true, maxerr: 50, indent: 4 */
/**
 * MongoDB - distinct-types.js
 * 
 *      Version: 1.0
 *         Date: April 29, 2012
 *      Project: http://skratchdot.github.com/mongodb-distinct-types/
 *  Source Code: https://github.com/skratchdot/mongodb-distinct-types/
 *       Issues: https://github.com/skratchdot/mongodb-distinct-types/issues/
 * Dependencies: MongoDB v1.8+
 * 
 * Description:
 * 
 * Similar to the db.myCollection.distinct() function, distinctTypes() will return
 * "types" rather than "values".  To accomplish this, it adds the following
 * function to the DBCollection prototype:
 * 
 *     DBCollection.prototype.distinctTypes = function (keyString, query, limit, skip) {};
 * 
 * Usage:
 * 
 * db.users.distinctTypes('name'); // we hope this would return ['bson'] not ['bson','string']
 * db.users.distinctTypes('name.first'); // should return ['string']
 * db.users.distinctTypes('address.phone'); // should return ['string']
 * db.users.distinctTypes('address.phone', {'name.first':'Bob'}); // only search documents that have { 'name.first' : 'Bob' }
 * db.users.distinctTypes('address.phone', {}, 10); // only search the first 10 documents
 * db.users.distinctTypes('address.phone', {}, 10, 5); // only search documents 10-15
 * 
 * Caveats:
 * 
 * By design, distinctTypes() returns 'bson' rather than 'object'.
 * It will return 'numberlong' rather than 'number', etc.
 * 
 * Copyright (c) 2012 SKRATCHDOT.COM
 * Dual licensed under the MIT and GPL licenses:
 *   http://www.opensource.org/licenses/mit-license.php
 *   http://www.gnu.org/licenses/gpl.html
 */
(function () {
	'use strict';

	var getType = function (obj) {
			return ({}).toString.call(obj).match(/\s([a-zA-Z]+)/)[1].toLowerCase();
		},
		getFromKeyString = function (obj, keyString) {
			var returnValue = {
					value : null,
					found : false
				},
				dotIndex = keyString.indexOf('.'),
				currentKey = '',
				newKeyString = '';
			if (dotIndex < 0) {
				if (obj.hasOwnProperty(keyString)) {
					returnValue = {
						value : obj[keyString],
						found : true
					};
				}
			} else {
				currentKey = keyString.substr(0, dotIndex);
				newKeyString = keyString.substr(dotIndex + 1);
				if (obj.hasOwnProperty(currentKey)) {
					returnValue = getFromKeyString(obj[currentKey], newKeyString);
				}
			}
			return returnValue;
		};

	/**
	 * @function
	 * @name distinctTypes
	 * @memberOf DBCollection
	 * @param {string} keyString The key (using dot notation) to return distinct types for
	 * @param {object} query A mongo query in the same format that db.myCollection.find() accepts.
	 * @param {number} limit Limit the result set by this number.
	 * @param {number} skip The number of records to skip.
	 */
	DBCollection.prototype.distinctTypes = function (keyString, query, limit, skip) {
		var fields = {},
			queryResult = null,
			result = [];
		if (typeof keyString !== 'string') {
			keyString = '';
		}
		fields[keyString] = 1;
		queryResult = new DBQuery(this._mongo, this._db, this, this._fullName,
				this._massageObject(query), fields, limit, skip).forEach(function (doc) {
			var type = '', currentValue = getFromKeyString(doc, keyString);
			if (currentValue.found) {
				type = getType(currentValue.value);
				if (result.indexOf(type) === -1) {
					result.push(type);
				}
			}
		});
		return result;
	};
}());/*global DBCollection: false, emit: false */
/*jslint devel: false, unparam: true, nomen: true, maxerr: 50, indent: 4 */
/**
 * MongoDB - flatten.js
 * 
 *      Version: 1.0
 *         Date: April 29, 2012
 *      Project: http://skratchdot.github.com/mongodb-flatten/
 *  Source Code: https://github.com/skratchdot/mongodb-flatten/
 *       Issues: https://github.com/skratchdot/mongodb-flatten/issues/
 * Dependencies: MongoDB v1.8+
 * 
 * Description:
 * 
 * The flatten() function is a mapReduce that flattens documents into
 * key/value pairs.  Since this is a mapReduce, you can access the 
 * keys via 'value.data.k' and the values via 'value.data.v'.
 * 
 * Usage:
 * 
 * // Flatten all user documents, and return the result inline.
 * result = db.users.flatten();
 * 
 * // Flatten all user documents, and store the result in the users_flattened collection
 * result = db.users.flatten('users_flattened');
 * 
 * // Flatten user documents that have the first name of Bob. Store in a collection
 * db.users.flatten({
 *     'out' : 'users_flattened',
 *     'query' : { 'name.first' : 'Bob' }
 * });
 * 
 * // Get the number of keys in one document
 * db.users.flatten({
 *     query : { '_id' : ObjectId('4f9c2374992274fc8d468675') }
 * }).results[0].value.data.length;
 * 
 * Copyright (c) 2012 SKRATCHDOT.COM
 * Dual licensed under the MIT and GPL licenses:
 *   http://www.opensource.org/licenses/mit-license.php
 *   http://www.gnu.org/licenses/gpl.html
 */
(function () {
	'use strict';

	/**
	 * @function
	 * @name flatten
	 * @memberOf DBCollection
	 * @param {object} optionsOrOutString This function accepts the same options as mapReduce
	 */
	DBCollection.prototype.flatten = function (optionsOrOutString) {
		var map, reduce, options = {};

		// Declare our map function
		// This will emit keyStrings for all the simple values (aka non-object and non-array)
		map = function () {
			var emitKeys = function (id, node, keyString) {
				var key, newKey, type = typeof (node);
				if (type === 'object' || type === 'array') {
					for (key in node) {
						if (node.hasOwnProperty(key)) {
							newKey = (keyString === '' ? key : keyString + '.' + key);
							if (newKey === '_id') {
								emit(id, {k : '_id', v : node[key]});
							} else {
								emitKeys(id, node[key], newKey);
							}
						}
					}
				} else {
					emit(id, {k : keyString, v : node});
				}
			};
			emitKeys(this._id, this, '');
		};

		// Declare our reduce function
		reduce = function (key, values) {
			return { data : values };
		};

		// Start to setup our options struct
		if (typeof optionsOrOutString === 'object') {
			options = optionsOrOutString;
		} else if (typeof optionsOrOutString === 'string') {
			options.out = optionsOrOutString;
		}

		// The default value for out is 'inline'
		if (!options.hasOwnProperty('out')) {
			options.out = { inline : 1 };
		}

		// Make sure to override certain options
		options.map = map;
		options.reduce = reduce;
		options.mapreduce = this._shortName;

		// Execute and return
		return this.mapReduce(map, reduce, options);
	};

}());/*global DBCollection: false, emit: false, print: false */
/*jslint devel: false, nomen: true, unparam: true, plusplus: true, maxerr: 50, indent: 4 */
/**
 * MongoDB - schema.js
 * 
 *      Version: 1.1
 *         Date: May 28, 2012
 *      Project: http://skratchdot.github.com/mongodb-schema/
 *  Source Code: https://github.com/skratchdot/mongodb-schema/
 *       Issues: https://github.com/skratchdot/mongodb-schema/issues/
 * Dependencies: MongoDB v1.8+
 * 
 * Description:
 * 
 * This is a schema analysis tool for MongoDB. It accomplishes this by
 * extended the mongo shell, and providing a new function called schema()
 * with the following signature:
 * 
 *     DBCollection.prototype.schema = function (optionsOrOutString)
 * 
 * Usage:
 * 
 *  The schema() function accepts all the same parameters that the mapReduce() function
 *  does. It adds/modifies the following 4 parameters that can be used as well:
 * 
 *      wildcards - array (default: [])
 *          By using the $, you can combine report results.
 *          For instance: '$' will group all top level keys and
 *          'foo.$.bar' will combine 'foo.baz.bar' and 'foo.bar.bar'
 * 
 *      arraysAreWildcards - boolean (default: true)
 *          When true, 'foo.0.bar' and 'foo.1.bar' will be
 *          combined into 'foo.$.bar'
 *          When false, all array keys will be reported
 * 
 *      fields - object (default: {})
 *          Similar to the usage in find(). You can pick the
 *          fields to include or exclude. Currently, you cannot
 *          pass in nested structures, you need to pass in dot notation keys.
 *      
 *      limit - number (default: 50)
 *          Behaves the same as the limit in mapReduce(), but defaults to 50.
 *          You can pass in 0 or -1 to process all documents.
 * 
 * Return schema results inline
 *     db.users.schema();
 * 
 * Create and store schema results in the 'users_schema' collection
 *     db.users.schema('users_schema'); // Option 1
 *     db.users.schema({out:'users_schema'}); // Option 2
 *     db.users.schema({out:{replace:'users_schema'}}); // Option 3
 * 
 * Only report on the key: 'name.first'
 *     db.users.schema({fields:{'name.first':1}});
 * 
 * Report on everything except 'name.first'
 *     db.users.schema({fields:{'name.first':-1}});
 * 
 * Combine the 'name.first' and 'name.last' keys into 'name.$'
 *     db.users.schema({wildcards:['name.$']});
 * 
 * Don't treat arrays as a wildcard
 *     db.users.schema({arraysAreWildcards:false});
 * 
 * Process 50 documents
 *     db.users.schema();
 * 
 * Process all documents
 *     db.users.schema({limit:-1});
 * 
 * Caveats:
 * 
 * By design, schema() returns 'bson' rather than 'object'.
 * It will return 'numberlong' rather than 'number', etc.
 * 
 * Inspired by:
 * 
 * Variety: https://github.com/JamesCropcho/variety
 * 
 * Copyright (c) 2012 SKRATCHDOT.COM
 * Dual licensed under the MIT and GPL licenses:
 *   http://www.opensource.org/licenses/mit-license.php
 *   http://www.gnu.org/licenses/gpl.html
 */
(function () {
	'use strict';

	/**
	 * You can pass in the same options object that mapReduce() accepts. Schema has the following
	 * defaults for options:
	 * 
	 * options.out = { inline : 1 };
	 * options.limit = 50;
	 * 
	 * You can pass in an options.limit value of 0 or -1 to parse _all_ documents.
	 * 
	 * @function
	 * @name flatten
	 * @memberOf DBCollection
	 * @param {object} optionsOrOutString This function accepts the same options as mapReduce
	 */
	DBCollection.prototype.schema = function (optionsOrOutString) {
		var statCount = 0, wildcards = [], arraysAreWildcards = true,
			field, fields = {}, usePositiveFields = false, useNegativeFields = false,
			getType, getNewKeyString, getKeyInfo, map, reduce, finalize, options = { limit : 50 };

		/**
		 * @function
		 * @name getType
		 * @private
		 * @param {object} obj The object to inspect
		 */
		getType = function (obj) {
			return ({}).toString.call(obj).match(/\s([a-zA-Z]+)/)[1].toLowerCase();
		};

		/**
		 * @function
		 * @name getNewKeyString
		 * @private
		 * @param {string} key The current key
		 * @param {string} keyString The object to inspect
		 */
		getNewKeyString = function (key, keyString) {
			var i, j, keyArray, newKeyString, success, wc;
			newKeyString = (keyString === '' ? key : keyString + '.' + key);
			if (wildcards.length > 0) {
				keyArray = newKeyString.split('.');
				for (i = 0; i < wildcards.length; i++) {
					wc = wildcards[i].split('.');
					if (keyArray.length === wc.length) {
						success = true;
						for (j = 0; success && j <= wc.length; j++) {
							if (wc[j] !== '$' && wc[j] !== keyArray[j]) {
								success = false;
							}
						}
						if (success) {
							return wildcards[i];
						}
					}
				}
			}
			return newKeyString;
		};

		/**
		 * @function
		 * @name getKeyInfo
		 * @private
		 * @param {object} node The node from which we generate our keys
		 * @param {string} keyString A string representing the current key 'path'
		 * @param {object} keyInfo The struct that contains all our 'paths' as the key, and a count for it's value
		 */
		getKeyInfo = function (node, keyString, keyInfo) {
			var key, newKeyString, type, useArrayWildcard = false;

			// Store the mongo type. 'bson' instead of 'object', etc
			type = getType(node);

			// We need to handle objects and arrays by calling getKeyInfo() recursively
			if (['array', 'bson', 'object'].indexOf(type) >= 0) {

				// Set the flag to be used in our for loop below
				if (type === 'array' && arraysAreWildcards === true) {
					useArrayWildcard = true;
				}

				// Loop through each key
				for (key in node) {
					if (node.hasOwnProperty(key)) {
						if (useArrayWildcard) {
							newKeyString = keyString + '.$';
						} else {
							newKeyString = getNewKeyString(key, keyString);
						}
						keyInfo = getKeyInfo(node[key], newKeyString, keyInfo);
					}
				}

			}

			// We don't need to emit this key
			// Using a long statement to pass jslint
			// there are 3 parts to this:
			// 1: empty key
			// 2: usePostiveFields is true, and the current key is not valid
			// 3: useNegativeFields is true, and the current key exists in fields (and is -1)
			if (keyString === '' || (usePositiveFields && (!fields.hasOwnProperty(keyString) || fields[keyString] !== 1)) || (useNegativeFields && fields.hasOwnProperty(keyString) && fields[keyString] === -1)) {
				return keyInfo;
			}

			// We need to emit this key
			if (keyInfo.hasOwnProperty(keyString) && keyInfo[keyString].hasOwnProperty(type)) {
				keyInfo[keyString][type].perDoc += 1;
			} else {
				keyInfo[keyString] = {};
				keyInfo[keyString][type] = {
					docs : 1,
					coverage : 0,
					perDoc : 1
				};
			}

			return keyInfo;
		};

		/**
		 * @function
		 * @name map
		 * @private
		 */
		map = function () {
			var key, keyInfo, count, type;

			// Get our keyInfo struct
			keyInfo = getKeyInfo(this, '', {}, [], true);

			// Loop through keys, emitting info
			for (key in keyInfo) {
				if (keyInfo.hasOwnProperty(key)) {
					count = 0;
					for (type in keyInfo[key]) {
						if (keyInfo[key].hasOwnProperty(type)) {
							count += keyInfo[key][type].perDoc;
						}
					}
					keyInfo[key].all = {
						docs : 1,
						perDoc : count
					};
					emit(key, keyInfo[key]);
				}
			}
		};

		/**
		 * @function
		 * @name reduce
		 * @private
		 * @param {string} key The key that was emitted from our map function
		 * @param {array} values An array of values that was emitted from our map function
		 */
		reduce = function (key, values) {
			var result = {};
			values.forEach(function (value) {
				var type;
				for (type in value) {
					if (value.hasOwnProperty(type)) {
						if (!result.hasOwnProperty(type)) {
							result[type] = { docs : 0, coverage : 0, perDoc : 0 };
						}
						result[type].docs += value[type].docs;
						result[type].perDoc += value[type].perDoc;
					}
				}
			});
			return result;
		};

		/**
		 * @function
		 * @name finalize
		 * @private
		 * @param {string} key The key that was emitted/returned from our map/reduce functions
		 * @param {object} value The object that was returned from our reduce function
		 */
		finalize = function (key, value) {
			var type, result = {
				wildcard : (key.search(/^\$|\.\$/gi) >= 0),
				types : [],
				results : [{
					type : 'all',
					docs : value.all.docs,
					coverage : (value.all.docs / statCount) * 100,
					perDoc : value.all.perDoc / value.all.docs
				}]
			};
			for (type in value) {
				if (value.hasOwnProperty(type) && type !== 'all') {
					result.types.push(type);
					result.results.push({
						type : type,
						docs : value[type].docs,
						coverage : (value[type].docs / statCount) * 100,
						perDoc : value[type].perDoc / value[type].docs
					});
				}
			}
			return result;
		};

		// Start to setup our options struct
		if (typeof optionsOrOutString === 'object') {
			options = optionsOrOutString;
		} else if (typeof optionsOrOutString === 'string') {
			options.out = optionsOrOutString;
		}

		// The default value for out is 'inline'
		if (!options.hasOwnProperty('out')) {
			options.out = { inline : 1 };
		}

		// Was a valid wildcards option passed in?
		if (options.hasOwnProperty('wildcards') && getType(options.wildcards) === 'array') {
			wildcards = options.wildcards;
		}

		// Was a valid arraysAreWildcards option passed in?
		if (options.hasOwnProperty('arraysAreWildcards') && typeof options.arraysAreWildcards === 'boolean') {
			arraysAreWildcards = options.arraysAreWildcards;
		}

		// Was a valid fields option passed in?
		if (options.hasOwnProperty('fields') && getType(options.fields) === 'object' && Object.keySet(options.fields).length > 0) {
			fields = options.fields;
			for (field in fields) {
				if (fields.hasOwnProperty(field)) {
					if (fields[field] === 1 || fields[field] === true) {
						fields[field] = 1;
						usePositiveFields = true;
					} else {
						fields[field] = -1;
					}
				}
			}
			if (!usePositiveFields) {
				useNegativeFields = true;
			}
		}

		// Store the total number of documents to be used in the finalize function
		statCount = this.stats().count;
		if (options.hasOwnProperty('limit') && typeof options.limit === 'number' && options.limit > 0 && options.limit < statCount) {
			statCount = options.limit;
		} else if (options.hasOwnProperty('limit')) {
			delete options.limit;
		}

		// Make sure to override certain options
		options.map = map;
		options.reduce = reduce;
		options.finalize = finalize;
		options.mapreduce = this._shortName;
		options.scope = {
			getType : getType,
			getNewKeyString : getNewKeyString,
			getKeyInfo : getKeyInfo,
			statCount : statCount,
			wildcards : wildcards,
			arraysAreWildcards : arraysAreWildcards,
			fields : fields,
			usePositiveFields : usePositiveFields,
			useNegativeFields : useNegativeFields
		};

		// Execute and return
		print('Processing ' + statCount + ' document(s)...');
		return this.mapReduce(map, reduce, options);
	};

}());/*global DBCollection: false, DBQuery: false, tojson: false */
/*jslint devel: false, nomen: true, maxerr: 50, indent: 4 */
/**
 * MongoDB - wild.js
 * 
 *      Version: 1.0
 *         Date: April 29, 2012
 *      Project: http://skratchdot.github.com/mongodb-wild/
 *  Source Code: https://github.com/skratchdot/mongodb-wild/
 *       Issues: https://github.com/skratchdot/mongodb-wild/issues/
 * Dependencies: MongoDB v1.8+
 * 
 * Description:
 * 
 * Adds a wildcard search to the shell.  You can run the new
 * wild() function on a collection, or on a query result.
 * The search is performed by converting each document to json,
 * and then running a regex that json.
 * 
 * Usage:
 * 
 * // Search entire users collection for Bob
 * db.users.wild('Bob');
 * db.users.wild(/Bob/gi);
 * db.users.find().wild('Bob');
 * 
 * // Search for exact values of 'Bob'
 * db.users.wild(': "Bob"');
 * 
 * // Search for exact keys called 'Bob'
 * db.users.wild('"Bob" :');
 * 
 * // Search for documents containing 'Bob', filtering by last name of 'Smith'
 * db.users.wild('Bob', {'name.last' : 'Smith'});
 * db.users.find({'name.last' : 'Smith'}).wild('Bob');
 * 
 * Copyright (c) 2012 SKRATCHDOT.COM
 * Dual licensed under the MIT and GPL licenses:
 *   http://www.opensource.org/licenses/mit-license.php
 *   http://www.gnu.org/licenses/gpl.html
 */
(function () {
	'use strict';

	/**
	 * @function
	 * @name wild
	 * @memberOf DBQuery
	 * @param {String|RegExp} regex The regular expression to filter the query by
	 */
	DBQuery.prototype.wild = function (regex) {
		var doc, result = [];

		// Ensure we have a valid regex
		if (typeof regex === 'string') {
			regex = new RegExp(regex, 'gi');
		}
		if (regex instanceof RegExp === false) {
			regex = new RegExp();
		}

		// Build our result set.
		while (this.hasNext()) {
			doc = this.next();
			if (tojson(doc).search(regex) >= 0) {
				result.push(doc);
			}
		}

	    return result;
	};

	/**
	 * @function
	 * @name wild
	 * @memberOf DBCollection
	 * @param {String|RegExp} regex The regular expression to filter the query by
	 * @param {object} query This value will be passed through to the .find() function
	 * @param {object} fields This value will be passed through to the .find() function
	 * @param {number} limit This value will be passed through to the .find() function
	 * @param {number} skip This value will be passed through to the .find() function
	 * @param {number} batchSize This value will be passed through to the .find() function
	 * @param {object} options This value will be passed through to the .find() function
	 */
	DBCollection.prototype.wild = function (regex, query, fields, limit, skip, batchSize, options) {
		return this.find(query, fields, limit, skip, batchSize, options).wild(regex);
	};

}());
// HACK: so that moment.js works
// See: mesh.js
if (typeof window === 'function' && typeof window.moment !== 'undefined') {
	moment = window.moment;
	delete window;
}

// Mix in non-conflicting functions to the Underscore namespace
_.mixin(_.str.exports());

// Output the current version number when starting the shell.
mesh.version();
