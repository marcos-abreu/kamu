'use strict';

// Global Meta
var totalConn,
    currentConn,
    startedAt;

/*
 * starts the connections status
 */
exports.start = function() {
  totalConn = 0;
  currentConn = 0;
  startedAt = new Date();
};

/*
 * track new connection
 */
exports.open = function() {
  totalConn += 1;
  currentConn += 1;
};

/*
 * update connection status when closing a connection
 */
exports.close = function() {
  currentConn -= 1;
  if ( currentConn < 1 ) {
    currentConn = 0;
  }
};

/*
 * stringify the connections status
 *
 * @returns   string        connection status string
 */
exports.toString = function() {
  return currentConn + "/" + totalConn + ' since ' + startedAt.toString();
};
