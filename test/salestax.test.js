/* Copyright (c) 2010-2014 Nearform */
"use strict";


var seneca = require('seneca')

var assert = require('assert')
var async = require('async')


var si = seneca()
si.use('../salestax.js')

var salestaxpin = si.pin({role: 'salestax', cmd: '*'})


describe('salestax', function () {

  it('happy', function (done) {
    salestaxpin.salestax({
      net: 100,
      country: 'FR'
    }, function(err, result) {
      assert.ok(!err, err)
      assert.ok(result)
      assert.equal(result.tax, 20.6)
      assert.equal(result.total, 120.6)
      done()
    })
  })

})
