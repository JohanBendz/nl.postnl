'use strict';

const Homey = require('homey');

module.exports = [
	
	{
		method: 'get',
		path: '/user',
		fn: ( args ) => {
			return Homey.app.getUser()
		}
	},
	
	{
		method: 'put',
		path: '/user',
		fn: ( args ) => {
			return Homey.app.setUser( args.body.username, args.body.password )
		}
	},
	
	{
		method: 'delete',
		path: '/user',
		fn: ( args ) => {
			return Homey.app.unsetUser()
		}
	}
	
]