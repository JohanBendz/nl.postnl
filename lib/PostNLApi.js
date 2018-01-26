'use strict';

const rp = require('request-promise-native');

class PostNLApi {
	
	constructor() {
		
		this._apiUrl = 'https://jouw.postnl.nl/web/api/default';
		this._tokenUrl = 'https://jouw.postnl.nl/web/token';
		
		this._token = null;
		
	}
	
	setToken( token ) {
		this._token = token;
	}
	
	async getToken( username, password ) {
		return rp({
			method: 'post',
			url: this._tokenUrl,
			json: true,
			form: {
				grant_type: 'password',
				client_id: 'pwWebApp',
				username,
				password
			}
		}).then( token => {
			this.setToken( token );
			return token;
		}).catch( err => {
			if( err.statusCode === 400 ) throw new Error('invalid_credentials');
			throw err;
		})
	}
	
	async getInbox() {
		return this.get('/inbox')
	}
	
	async getProfile() {
		return this.get('/profile')
	}
	
	async api( method, path, body ) {	
		
		if( this._token === null )
			throw new Error('Missing Token');
			
		return rp({
			method,
			url: `${this._apiUrl}${path}`,
			headers: {
				Authorization: `Bearer ${this._token.access_token}`,
			},
			json: body || true,
		})		
	}
	
	async get( path ) {
		return this.api('get', path);
	}
	
}

module.exports = PostNLApi