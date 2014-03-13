/* Copyright (c) 2012-2014 Nearform, MIT License */
"use strict";

var ObjectTree = require('object-tree')
var _ = require('underscore')

function salestax(taxRates) {
  var seneca = this
  var plugin = 'salestax'

  taxRates = taxRates || {}

  seneca.add({ role: plugin, cmd:'salestax' }, function(args, callback) {
    calculate_salestax(Number(args.net), args.rate, callback)
  })

  function getTaxRateHandler(rate) {
    return function(args, callback) {
      seneca.act({role: plugin, cmd: 'salestax', net: args.net, rate: rate}, function(err, calculatedTax) {
        callback(err, calculatedTax)
      })
    }
  }

  function buildMicroservices(filter, taxRates) {
    for(var attr in taxRates) {
      if(attr === '*') {
        seneca.add(filter, getTaxRateHandler(taxRates[attr]))
      } else {
        for(var attrValue in taxRates[attr]) {
          var f = clone(filter)
          f[attr] = attrValue
          if(_.isObject(taxRates[attr][attrValue])) {
            buildMicroservices(f, taxRates[attr][attrValue])
          } else if(!isNaN(taxRates[attr][attrValue])) {
            seneca.add(f, getTaxRateHandler(taxRates[attr][attrValue]))
          } else {
            throw new Error('unsupported tax rate '+JSON.stringify(taxRates[attr][attrValue]))
          }
        }
      }

    }
  }

  buildMicroservices({role: plugin, cmd: 'salestax'}, taxRates)

  return {
    name: plugin
  }
}

function clone(obj) {
  var clone = {}
  for(var attr in obj) {
    clone[attr] = obj[attr]
  }
  return clone
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
