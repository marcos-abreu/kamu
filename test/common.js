global.rewire           = require( 'rewire' );                // easily expose privates from modules
global.sinon            = require( 'sinon' );                 // mocking framework
global.chai             = require( 'chai' );                  // BDD / TDD asserting library
global.expect           = require( 'chai' ).expect;           // expose assertion style
global.AssertionError   = require( 'chai' ).AssertionError;

var sinonChai           = require( 'sinon-chai' );            // custom assertions for using the sinon with chai
global.chai.use( sinonChai );                                 // bind sinon custom assertions to chai

var chaiAsPromised      = require( 'chai-as-promised' );
global.chai.use( chaiAsPromised );
