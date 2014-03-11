/* Copyright (c) 2012-2014 Nearform, MIT License */
"use strict";


function salestax(taxes) {
  var seneca = this
  var plugin = "salestax"

  taxes = seneca.util.deepextend({
    country: {
      'FR': 0.206,
      'UK': {
        '*': 0.20,
        category: {
          'energy': 0.05,
          'child': 0.05,
          'food': 0,
          'children_clothes': 0
        }
      }
    }
  }, taxes)

  seneca.add( {role:plugin, cmd:'salestax'},
    {},
    function(args, callback) {


      var attributes = {}
      for(var arg in args) {
        if(args.hasOwnProperty(arg)) {
          if(arg !== 'cmd' && arg != 'plugin' && arg != 'net' && !/\$$/m.test(arg)) {
            attributes[arg] = args[arg]
          }
        }
      }

      console.log('****************', JSON.stringify(attributes))
      console.log('****************', JSON.stringify(taxes))

      resolve_salestax(args.net, attributes, taxes, undefined, callback)
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
 * @param attributes
 * @param taxes
 * @param callback
 */
function resolve_salestax(netPrice, attributes, taxes, trace, callback) {
  for(var attr in attributes) {
    if(taxes && taxes.hasOwnProperty(attr)) {
      taxes = taxes[attr][attributes[attr]]
      delete attributes[attr]

      if(!trace) {
        trace = attr
      } else {
        trace += '.' + attr
      }

      resolve_salestax(netPrice, attributes, taxes, trace, callback)
      return
    }
  }

  // could not find a match, look for the wildcard
  var rate

  if(!isNaN(taxes)) {
    rate = taxes
  } else if(taxes && !isNaN(taxes['*'])) {
    rate = taxes['*']
  }

  if(rate) {
    calculate_salestax(netPrice, rate, callback)
  } else {
    setImmediate(function() {
      callback(new Error('Could not resolve tax rate '+JSON.stringify(attributes)+' for taxes '+JSON.stringify(taxes) + ' at '+trace))
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
