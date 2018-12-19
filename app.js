'use strict';

const Homey = require('homey')
const PostNLApi = require('./lib/PostNLApi.js')

const POLL_INTERVAL = 1000 * 60 * 5; // 5 min

class PostNLApp extends Homey.App {
	
	onInit() {
		
		// init flows
		this._statusFlows = {};
		
		for( let i = 1; i <= 4; i++ ) {
			let card = this._statusFlows[`status_${i}`] = new Homey.FlowCardTrigger(`status_${i}`);
				card.register();
		}
		
		// init postnl
		this._pollInboxInterval = setInterval(this.pollInbox.bind(this), POLL_INTERVAL);
		this.pollInbox();
		
		this.log('PostNLApp is running...');
		
	}
	
	async getUser() {
		return this._getAuthenticatedApi()
			.then( api => {
				return api.getProfile()
			})
	}
	
	async setUser( username, password ) {
		
		let api = new PostNLApi();
		return api.getToken( username, password )
			.then( token => {
						
				Homey.ManagerSettings.set('username', username);
				Homey.ManagerSettings.set('password', password);
				
				return api.getProfile();
			})
	}
	
	async unsetUser() {
		Homey.ManagerSettings.unset('username');
		Homey.ManagerSettings.unset('password');
	}
	
	async _getAuthenticatedApi() {
		
		let api = new PostNLApi();
		
		let username = Homey.ManagerSettings.get('username');
		let password = Homey.ManagerSettings.get('password');
				
		if( !username || !password ) throw new Error('missing_credentials');
		
		return api.getToken( username, password )
			.then( token => {
				return api;
			})
	}
	
	pollInbox() {
		this._getAuthenticatedApi()
			.then( api => {				
				return api.getInbox();
			}).then( inbox => {
				
				this.log(`Found ${inbox.receiver.length} shipments`);
				
				inbox.receiver.forEach(shipment => {
					//console.log(shipment);
					let key = shipment.key;
					let barcode = shipment.trackedShipment.barcode
					let senderTitle = ( shipment.sender && shipment.sender.companyName ) || ''
					let statusTitle = shipment.delivery.status
					let statusIndex = shipment.delivery.phase.index
					let title = shipment.trackedShipment.title || senderTitle || barcode
					let timeframe = shipment.delivery.timeframe
					
					var arr_from = timeframe.from.split("T");
					var time_from = arr_from[1].split("+");
					var arr_to = timeframe.to.split("T");
					var time_to = arr_to[1].split("+");
					
					let settingKey = `shipment_${key}`;
					let shouldSave = false;
					let shouldTriggerFlow = false;
					let setting = Homey.ManagerSettings.get(settingKey);
					if( setting ) {
						if( setting.statusIndex !== statusIndex ) {
							shouldSave = true;
							shouldTriggerFlow = true;
						}
					} else {
						shouldSave = true;
						shouldTriggerFlow = ( statusIndex < 4 )
					}
					
					if( shouldSave ) {
						Homey.ManagerSettings.set(settingKey, {
							barcode: barcode,
							statusIndex: statusIndex,
							lastUpdated: new Date(),
							timeframe_from: time_from[0],
							timeframe_to: time_to[0],
						})
					}
					
					if( shouldTriggerFlow ) {
						this.log(`Triggering Flow for ${title} (${barcode})`)
						this._statusFlows[`status_${statusIndex}`].trigger({
							barcode: barcode,
							title: title,
						}).catch( this.error )
					}
				})
			}).catch( err => {
				this.error( err );
			})
		
	}
	
}

module.exports = PostNLApp;