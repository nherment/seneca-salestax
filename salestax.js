/* Copyright (c) 2012-2014 Nearform, MIT License */
"use strict";

var fs = require('fs')

var defaultTaxRates = JSON.parse(fs.readFileSync('./default_tax_rates.json'))

function salestax(options) {
  var seneca = this
  var plugin = "salestax"

  options = seneca.util.deepextend({
    rates: defaultTaxRates
  }, options)

  seneca.add( {role:plugin, cmd:'configure'},
    function(args, callback) {
      if(arg.rates) {
        options.rates = args.rates
      }
      callback(undefined)
    })

  seneca.add( {role:plugin, cmd:'salestax'},
    function(args, callback) {

      var attributes = {}
      for(var arg in args) {
        if(args.hasOwnProperty(arg)) {
          if(arg !== 'cmd' && arg != 'plugin' && arg != 'net' && !/\$$/m.test(arg)) {
            attributes[arg] = args[arg]
          }
        }
      }

      resolve_salestax(args.net, attributes, options.rates, undefined, callback)
    })

  return {
    name:plugin
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
function resolve_salestax(netPrice, attributes, taxRates, trace, callback) {

  for(var attr in attributes) {
    if(taxRates && taxRates.hasOwnProperty(attr)) {
      taxRates = taxRates[attr][attributes[attr]]
      delete attributes[attr]

      if(!trace) {
        trace = attr
      } else {
        trace += '.' + attr
      }

      resolve_salestax(netPrice, attributes, taxRates, trace, callback)
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
    calculate_salestax(netPrice, rate, callback)
  } else {
    setImmediate(function() {
      callback(new Error('Could not resolve tax rate '+JSON.stringify(attributes)+' for taxRates '+JSON.stringify(taxRates) + ' at '+trace))
    })
  }
}

function calculate_salestax(net, rate, callback){
  var rate = isNaN(rate) ? 0 : rate
  var tax =  Math.round(100* net * rate) / 100
  var total = net + tax
  callback(null, { total: total, rate: rate, tax: tax })
}



module.exports = salestax
