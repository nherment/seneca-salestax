/* Copyright (c) 2010-2014 Nearform */
"use strict";


var seneca = require('seneca')

var assert = require('assert')
var async = require('async')


var si = seneca()
si.use('../salestax.js', {
  country: {
    'FR': 0.20,
    'UK': {
      '*': 0.20,
      category: {
        'energy': 0.05,
        'child': 0.05,
        'food': 0,
        'children_clothes': 0
      }
    },
    'IE': {
      'category': {
        'energy': 0.05,
        'child': 0.05,
        'food': 0,
        'children_clothes': 0
      }
    }
  }
})

var salestaxpin = si.pin({role: 'salestax', cmd: '*'})


describe('salestax', function () {

  it('happy', function (done) {
    salestaxpin.salestax({
      net: 100,
      country: 'FR'
    }, function(err, result) {
      assert.ok(!err, err)
      assert.ok(result)
      assert.equal(result.tax, 20)
      assert.equal(result.rate, 0.20)
      assert.equal(result.total, 120)
      done()
    })
  })

  it('wildcard', function (done) {
    salestaxpin.salestax({
      net: 100,
      country: 'UK'
    }, function(err, result) {
      assert.ok(!err, err)
      assert.ok(result)
      assert.equal(result.tax, 20)
      assert.equal(result.rate, 0.20)
      assert.equal(result.total, 120)
      done()
    })
  })

  it('nested', function (done) {
    salestaxpin.salestax({
      net: 100,
      country: 'UK',
      category: 'child'
    }, function(err, result) {
      assert.ok(!err, err)
      assert.ok(result)
      assert.equal(result.tax, 5)
      assert.equal(result.rate, 0.05)
      assert.equal(result.total, 105)
      done()
    })
  })

  it('non existent nested value', function (done) {
    salestaxpin.salestax({
      net: 100,
      country: 'UK',
      category: 'does not exist'
    }, function(err, result) {
      assert.ok(err)
      assert.ok(!result)
      done()
    })
  })

  it('no nested value fails if there is no wildcard', function (done) {
    salestaxpin.salestax({
      net: 100,
      country: 'IE'
    }, function(err, result) {
      assert.ok(err)
      assert.ok(!result)
      done()
    })
  })

})
