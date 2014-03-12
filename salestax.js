/* Copyright (c) 2012-2014 Nearform, MIT License */
"use strict";

function salestax(taxRates) {
  var seneca = this
  var plugin = 'salestax'

  taxRates = taxRates || {}

  seneca.add({ role: plugin, cmd:'resolve_salestax' }, function(args, callback) {
    resolve_salestax(args.taxCategory, taxRates, undefined, callback)
  })

  seneca.add({ role: plugin, cmd:'calculate_salestax' }, function(args, callback) {
    calculate_salestax(Number(args.net), args.taxRate, callback)
  })

  seneca.add({ role: plugin, cmd:'salestax' }, function(args, callback) {
    var taxCategory = {}
    for(var arg in args) {
      if(args.hasOwnProperty(arg)) {
        if(arg !== 'cmd' && arg != 'role' && arg != 'net' && !/\$$/m.test(arg)) {
          taxCategory[arg] = args[arg]
        }
      }
    }

    seneca.act({role: plugin, cmd: 'resolve_salestax', taxCategory: taxCategory, taxRates: taxRates}, function(err, taxRate) {
      if(err) {
        callback(err, undefined)
      } else {
        seneca.act({role: plugin, cmd: 'calculate_salestax', net: args.net, taxRate: taxRate}, function(err, calculatedTax) {
          callback(err, calculatedTax)
        })
      }
    })
  })

  return {
    name: plugin
  }
}


/** given:
 *    options: {
 *      'country': {
 *        'IE': {
 *          '*': 0.23,
 *          'category': {
 *            'reduced1': 0.135,
 *            'reduced2': 0.09,
 *            'livestock': 0.048,
 *            'farmers': 0.05
 *          }
 *        },
 *        'FR': 0.206
 *      }
 *    }
 *
 *
 *  {'country': 'IE'} ==> 0.23
 *  {'country': 'IE', 'category': 'livestock'} ==> 0.048
 *  {'country': 'IE', 'category': 'does not exist'} ==> Error
 *  {'country': 'FR', 'category': 'livestock'} ==> 0.206
 *
 */
function resolve_salestax(attributes, taxRates, trace, callback) {

  for(var attr in attributes) {
    if(taxRates && taxRates.hasOwnProperty(attr)) {
      taxRates = taxRates[attr][attributes[attr]]
      delete attributes[attr]

      if(!trace) {
        trace = attr
      } else {
        trace += '.' + attr
      }

      resolve_salestax(attributes, taxRates, trace, callback)
      return
    }
  }

  // could not find a match, look for the wildcard
  var rate

  if(!isNaN(taxRates)) {
    rate = taxRates
  } else if(taxRates && !isNaN(taxRates['*'])) {
    rate = taxRates['*']
  }

  if(rate) {
    callback(undefined, rate)
  } else {
    callback(new Error('Could not resolve tax rate '+JSON.stringify(attributes)+' for taxRates '+JSON.stringify(taxRates) + ' at '+trace))
  }
}

function calculate_salestax(net, rate, callback){
  var rate = isNaN(rate) ? 0 : rate

  // rounding to 2 decimals is because JS has rounding errors:
  // http://stackoverflow.com/questions/588004/is-floating-point-math-broken
  // TODO: make the number of decimal rounding configurable or maybe it's not this plugin's role to fix it
  var tax =  Math.round(100 * net * rate) / 100
  var total = Math.round(100 * (net + tax)) / 100
  callback(null, { total: total, rate: rate, tax: tax })
}

module.exports = salestax
