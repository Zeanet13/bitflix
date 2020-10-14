import React, { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { debounce } from 'lodash';
import { WS_URL, SESSION_TIME, BASE_CURRENCY, LANGUAGE_KEY } from '../../config/constants';
// import { isMobile } from 'react-device-detect';

import { getMe, setMe, setBalance, updateUser } from '../../actions/userAction';
import { addUserTrades } from '../../actions/walletActions';
import {
	setUserOrders,
	addOrder,
	updateOrder,
	removeOrder
} from '../../actions/orderAction';
import {
	setOrderbooks,
	setTrades,
	setOrderbook,
	addTrades,
	setPairsData
} from '../../actions/orderbookAction';
import {
	setTickers,
	setPairs,
	changePair,
	setCurrencies,
	setNotification,
	closeNotification,
	openContactForm,
	openHelpfulResourcesForm,
	setLanguage,
	changeTheme,
	closeAllNotification,
	setChatUnreadMessages,
	setOrderLimits,
	NOTIFICATIONS,
	setSnackDialog,
	setValidBaseCurrency,
	setConfig,
	setInfo,
	requestInitial,
	requestConstant
} from '../../actions/appActions';

import { playBackgroundAudioNotification } from '../../utils/utils';
import { getToken, isLoggedIn } from '../../utils/token';

class Container extends Component {
	constructor(props) {
		super(props);
		this.state = {
			publicSocket: undefined,
			privateSocket: undefined,
			idleTimer: undefined,
			ordersQueued: [],
			limitFilledOnOrder: ''
		}
		this.orderCache = {};
		this.wsInterval = null;
	}

	limitTimeOut = null;

	componentDidMount() {
		if (!this.props.fetchingAuth) {
			this.initSocketConnections();
		}
	}

	UNSAFE_componentWillReceiveProps(nextProps) {
		if (
			!nextProps.fetchingAuth &&
			nextProps.fetchingAuth !== this.props.fetchingAuth
		) {
			if (!this.state.publicSocket) {
				this.initSocketConnections();
			}
		}
	}

	componentWillUnmount() {
		if (this.state.publicSocket) {
			this.state.publicSocket.close();
		}

		if (this.state.privateSocket) {
			this.state.privateSocket.close();
		}

		if (this.state.idleTimer) {
			clearTimeout(this.state.idleTimer);
		}
		clearTimeout(this.limitTimeOut);
		if (this.wsInterval) {
			clearInterval(this.wsInterval);
		}
	}

	_resetTimer = () => {
		if (this.state.idleTimer) {
			clearTimeout(this.idleTimer);
		}
		if (this.state.appLoaded) {
			const idleTimer = setTimeout(() => this.props.logout('Inactive'), SESSION_TIME); // no activity will log the user out automatically
			this.setState({ idleTimer });
		}
	};

	resetTimer = debounce(this._resetTimer, 250);

	initSocketConnections = () => {
		let token = '';
		this.setPublicWS();
		if (isLoggedIn()) {
			token = getToken();
		}
		this.setUserSocket(token);
		this.setState({ appLoaded: true }, () => {
			this.props.connectionCallBack(true);
			this._resetTimer();
		});
	};

	storeData = (data) => {
		this.props.setOrderbooks(data);
		this.orderCache = {};
	};

	storeOrderData = debounce(this.storeData, 250);

	setPublicWS = () => {
		// const publicSocket = new WebSocket(`${WS_URL}/stream`);
		// this.setState({ publicSocket });

		requestInitial()
			.then((res) => {
				if (res && res.data) {
					this.props.setConfig(res.data);
					if (res.data.defaults) {
						const themeColor = localStorage.getItem('theme');
						const language = localStorage.getItem(LANGUAGE_KEY);
						if (!themeColor && res.data.defaults.theme) {
							this.props.changeTheme(res.data.defaults.theme);
							localStorage.setItem('theme', res.data.defaults.theme);
						}
						if (!language && res.data.defaults.language) {
							this.props.changeLanguage(res.data.defaults.language);
						}
					}
				};
				if (res.data.info) this.props.setInfo({ ...res.data.info });
			})
			.catch(err => {
				console.error(err);
			});

		requestConstant()
			.then((res) => {
				if (res && res.data) {
					if (!this.props.pair) {
						const pair = Object.keys(res.data.pairs)[0];
						this.props.changePair(pair);
					}
					this.props.setPairs(res.data.pairs);
					this.props.setPairsData(res.data.pairs);
					this.props.setCurrencies(res.data.coins);

					const pairWithBase = Object.keys(res.data.pairs).filter((key) => {
						let temp = res.data.pairs[key];
						return temp.pair_2 === BASE_CURRENCY;
					});
					const isValidPair = pairWithBase.length > 0;
					this.props.setValidBaseCurrency(isValidPair);
					const orderLimits = {};
					Object.keys(res.data.pairs).map((pair, index) => {
						orderLimits[pair] = {
							PRICE: {
								MIN: res.data.pairs[pair].min_price,
								MAX: res.data.pairs[pair].max_price,
								STEP: res.data.pairs[pair].increment_price
							},
							SIZE: {
								MIN: res.data.pairs[pair].min_size,
								MAX: res.data.pairs[pair].max_size,
								STEP: res.data.pairs[pair].increment_price
							}
						};
						return '';
					});
					this.props.setOrderLimits(orderLimits);
				}
			})
			.catch(err => console.error(err))

	};

	getUserDetails = () => {
		return this.props
			.getMe()
			.then(({ value }) => {
				if (value && value.data && value.data.id) {
					const data = value.data;
					const { defaults = {} } = this.props.constants;
					let userData = { ...data };
					if (data.settings) {
						if (
							!data.settings.language &&
							!this.props.activeLanguage &&
							defaults.language
						) {
							this.props.changeLanguage(defaults.language);
							userData = {
								...data,
								settings: {
									...data.settings,
									language: defaults.language
								}
							};
						} else if (data.settings.language !== this.props.activeLanguage) {
							this.props.changeLanguage(data.settings.language);
						}
						if (data.settings.interface) {
							if (
								!data.settings.interface.theme &&
								!this.props.activeTheme &&
								defaults.theme
							) {
								this.props.changeTheme(defaults.theme);
								localStorage.setItem('theme', defaults.theme);
								userData = {
									...data,
									settings: {
										...data.settings,
										interface: {
											...data.settings.interface,
											theme: defaults.theme
										}
									}
								};
							} else if (data.settings.interface.theme !== this.props.activeTheme) {
								this.props.changeTheme(data.settings.interface.theme);
								localStorage.setItem('theme', data.settings.interface.theme);
							}
						}
					}
					this.props.setMe(userData);
				}
			})
			.catch((err) => {
				const message = err.message || JSON.stringify(err);
				this.props.setNotification(NOTIFICATIONS.ERROR, message);
			});
	};

	setUserSocket = (token) => {
		let url = `${WS_URL}/stream`;
		if (token) {
			url = `${WS_URL}/stream?authorization=Bearer ${token}`;
		}
		const privateSocket = new WebSocket(url);

		this.setState({ privateSocket });

		this.getUserDetails();

		privateSocket.onopen = (evt) => {
			console.log('Connected Private Socket', evt);
			privateSocket.send(
				JSON.stringify({
					op: 'subscribe',
					args: ['orderbook', 'trade', 'wallet', 'order', 'userTrade'],
				})
			);
			this.wsInterval = setInterval(() => {
				privateSocket.send(
					JSON.stringify({
						op: 'ping'
					})
				);
			}, 55000);
		};

		privateSocket.onmessage = (evt) => {
			const data = JSON.parse(evt.data);
			switch (data.topic) {
				case 'trade':
					const tradesData = {
						...data,
						[data.symbol]: data.data
					}
					delete tradesData.data;
					this.props.setTrades(tradesData);
					this.props.setTickers(tradesData);
					if (data.action === 'update') {
						if (
							this.props.settings.audio &&
							this.props.settings.audio.public_trade &&
							this.props.location.pathname.indexOf('/trade/') === 0 &&
							this.props.router.params.pair
						) {
							playBackgroundAudioNotification('public_trade', this.props.settings);
						}
					}
					break;
				case 'orderbook':
					const tempData = {
						...data,
						[data.symbol]: data.data
					};
					delete tempData.data;
					this.orderCache = { ...this.orderCache, ...tempData };
					this.storeOrderData(this.orderCache);
					// this.props.setOrderbooks(data);
					break;
				case 'order':
					this.props.setUserOrders(data.data);
					break;
				case 'userTrade':
					this.props.addUserTrades(data.data);
					break;
				case 'wallet':
					this.props.setBalance(data.data);
					break;
				default:
					break;
			};
		}

		// privateSocket.on('error', (error) => {
		// 	if (
		// 		error &&
		// 		typeof error === 'string' &&
		// 		error.indexOf('Access Denied') > -1
		// 	) {
		// 		this.props.logout('Token is expired');
		// 	}
		// });

		// privateSocket.on('orders', ({ action, data }) => {
		// 	this.props.setUserOrders(data);
		// });

		// privateSocket.on('trades', ({ action, data }) => {
		// 	// this.props.addUserTrades(data);
		// });

		// privateSocket.on('wallet', ({ action, balance }) => {
		// 	this.props.setBalance(balance);
		// });

		// privateSocket.on('update', ({ action, type, data }) => {
		// 	switch (type) {
		// 		case 'order_queued':
		// 			// TODO add queued orders to the store
		// 			// this.props.addOrder(data);
		// 			this.setState({
		// 				ordersQueued: this.state.ordersQueued.concat(data)
		// 			});
		// 			if (data.type === 'limit') {
		// 				playBackgroundAudioNotification('orderbook_limit_order', this.props.settings);
		// 				this.setState({ limitFilledOnOrder: data.id });
		// 				this.limitTimeOut = setTimeout(() => {
		// 					if (this.state.limitFilledOnOrder)
		// 						this.setState({ limitFilledOnOrder: '' });
		// 				}, 1000);
		// 			}
		// 			break;
		// 		case 'order_processed':
		// 		case 'order_canceled': {
		// 			const ordersQueued = [].concat(this.state.ordersQueued);
		// 			const indexOfOrder = ordersQueued.findIndex(
		// 				(order) => order.id === data.id
		// 			);
		// 			if (indexOfOrder > -1) {
		// 				ordersQueued.splice(indexOfOrder, 1);
		// 			}
		// 			this.setState({ ordersQueued });
		// 			break;
		// 		}
		// 		case 'order_added': {
		// 			const { ordersQueued } = this.state;
		// 			const indexOfOrder = ordersQueued.findIndex(
		// 				({ id }) => id === data.id
		// 			);
		// 			if (indexOfOrder > -1) {
		// 				ordersQueued.splice(indexOfOrder, 1);
		// 				this.setState({ ordersQueued });
		// 			}
		// 			this.props.addOrder(data);
		// 			// this.props.setNotification(NOTIFICATIONS.ORDERS, { type, data });
		// 			break;
		// 		}
		// 		case 'order_partialy_filled': {
		// 			// let filled = 0;
		// 			// const order = this.props.orders.find(order => order.id === data.id)
		// 			// if (order) {
		// 			// 	filled = order.filled;
		// 			// }
		// 			this.props.updateOrder(data);
		// 			if (
		// 				this.props.settings.notification &&
		// 				this.props.settings.notification.popup_order_partially_filled
		// 			) {
		// 				// data.filled = data.filled - filled;
		// 				if (isMobile) {
		// 					this.props.setSnackDialog({
		// 						isDialog: true,
		// 						type: 'order',
		// 						data: {
		// 							type,
		// 							order: data,
		// 							data
		// 						}
		// 					});
		// 				} else {
		// 					this.props.setNotification(NOTIFICATIONS.ORDERS, {
		// 						type,
		// 						order: data,
		// 						data
		// 					});
		// 				}
		// 			}
		// 			if (
		// 				this.props.settings.audio &&
		// 				this.props.settings.audio.order_partially_completed
		// 			) {
		// 				playBackgroundAudioNotification('order_partialy_filled', this.props.settings);
		// 			}
		// 			break;
		// 		}
		// 		case 'order_updated':
		// 			this.props.updateOrder(data);
		// 			this.props.setNotification(
		// 				NOTIFICATIONS.ORDERS,
		// 				{ type, data },
		// 				false
		// 			);
		// 			break;
		// 		case 'order_filled': {
		// 			const ordersDeleted = this.props.orders.filter((order, index) => {
		// 				return (
		// 					data.findIndex((deletedOrder) => deletedOrder.id === order.id) >
		// 					-1
		// 				);
		// 			});
		// 			this.props.removeOrder(data);
		// 			if (
		// 				this.props.settings.notification &&
		// 				this.props.settings.notification.popup_order_completed
		// 			) {
		// 				ordersDeleted.forEach((orderDeleted) => {
		// 					if (isMobile) {
		// 						this.props.setSnackDialog({
		// 							isDialog: true,
		// 							type: 'order',
		// 							data: {
		// 								type,
		// 								data: {
		// 									...orderDeleted,
		// 									filled: orderDeleted.size
		// 								}
		// 							}
		// 						});
		// 					} else {
		// 						this.props.setNotification(NOTIFICATIONS.ORDERS, {
		// 							type,
		// 							data: {
		// 								...orderDeleted,
		// 								filled: orderDeleted.size
		// 							}
		// 						});
		// 					}
		// 				});
		// 			}
		// 			if (
		// 				this.props.settings.audio &&
		// 				this.props.settings.audio.order_completed
		// 			) {
		// 				playBackgroundAudioNotification('order_filled', this.props.settings);
		// 			}
		// 			break;
		// 		}
		// 		case 'order_removed':
		// 			this.props.removeOrder(data);
		// 			this.props.setNotification(
		// 				NOTIFICATIONS.ORDERS,
		// 				{ type, data },
		// 				false
		// 			);
		// 			break;
		// 		case 'trade': {
		// 			this.props.addUserTrades(data.reverse());
		// 			const tradeOrdersIds = new Set();
		// 			data.forEach((trade) => {
		// 				if (trade.id) {
		// 					tradeOrdersIds.add(trade.id);
		// 				}
		// 			});
		// 			if (tradeOrdersIds.size === 1) {
		// 				const orderIdFromTrade = Array.from(tradeOrdersIds)[0];
		// 				const { ordersQueued } = this.state;
		// 				let order = ordersQueued.find(({ id }) => id === orderIdFromTrade);
		// 				if (!order) {
		// 					const { orders } = this.props;
		// 					order = orders.find(({ id }) => id === orderIdFromTrade);
		// 				}
		// 				if (
		// 					order &&
		// 					order.type === 'market' &&
		// 					this.props.settings.notification &&
		// 					this.props.settings.notification.popup_order_completed
		// 				) {
		// 					if (isMobile) {
		// 						this.props.setSnackDialog({
		// 							isDialog: true,
		// 							type: 'trade',
		// 							data: { order, data }
		// 						});
		// 					} else {
		// 						this.props.setNotification(NOTIFICATIONS.TRADES, {
		// 							data,
		// 							order
		// 						});
		// 					}
		// 				}
		// 			}
		// 			if (
		// 				this.state.limitFilledOnOrder &&
		// 				data.filter((limit) => limit.id === this.state.limitFilledOnOrder)
		// 					.length &&
		// 				this.props.settings.audio &&
		// 				this.props.settings.audio.order_completed
		// 			) {
		// 				setTimeout(() => {
		// 					playBackgroundAudioNotification('order_filled', this.props.settings);
		// 				}, 1000);
		// 			}
		// 			break;
		// 		}
		// 		case 'deposit': {
		// 			const show = data.status || data.currency !== BASE_CURRENCY;
		// 			data.coins = this.props.coins;
		// 			this.props.setNotification(NOTIFICATIONS.DEPOSIT, data, show);
		// 			break;
		// 		}
		// 		case 'withdrawal': {
		// 			// TODO FIX when notification is defined

		// 			const show = data.amount;
		// 			this.props.setNotification(NOTIFICATIONS.WITHDRAWAL, data, !show);
		// 			break;
		// 		}
		// 		default:
		// 			break;
		// 	}
		// 	});
	};

	render() {
		return <div />;
	}
}

const mapStateToProps = (store) => ({
	pair: store.app.pair,
	coins: store.app.coins,
	symbol: store.orderbook.symbol,
	prices: store.orderbook.prices,
	fetchingAuth: store.auth.fetching,
	activeNotification: store.app.activeNotification,
	verification_level: store.user.verification_level,
	activeLanguage: store.app.language,
	activeTheme: store.app.theme,
	orders: store.order.activeOrders,
	user: store.user,
	unreadMessages: store.app.chatUnreadMessages,
	orderbooks: store.orderbook.pairsOrderbooks,
	pairsTrades: store.orderbook.pairsTrades,
	settings: store.user.settings,
	constants: store.app.constants,
	info: store.app.info
});

const mapDispatchToProps = (dispatch) => ({
	addTrades: bindActionCreators(addTrades, dispatch),
	setOrderbook: bindActionCreators(setOrderbook, dispatch),
	setMe: bindActionCreators(setMe, dispatch),
	setBalance: bindActionCreators(setBalance, dispatch),
	setUserOrders: bindActionCreators(setUserOrders, dispatch),
	addOrder: bindActionCreators(addOrder, dispatch),
	updateOrder: bindActionCreators(updateOrder, dispatch),
	removeOrder: bindActionCreators(removeOrder, dispatch),
	addUserTrades: bindActionCreators(addUserTrades, dispatch),
	updateUser: bindActionCreators(updateUser, dispatch),
	closeNotification: bindActionCreators(closeNotification, dispatch),
	closeAllNotification: bindActionCreators(closeAllNotification, dispatch),
	openContactForm: bindActionCreators(openContactForm, dispatch),
	openHelpfulResourcesForm: bindActionCreators(
		openHelpfulResourcesForm,
		dispatch
	),
	setNotification: bindActionCreators(setNotification, dispatch),
	changeLanguage: bindActionCreators(setLanguage, dispatch),
	changePair: bindActionCreators(changePair, dispatch),
	setPairs: bindActionCreators(setPairs, dispatch),
	setPairsData: bindActionCreators(setPairsData, dispatch),
	setOrderbooks: bindActionCreators(setOrderbooks, dispatch),
	setTrades: bindActionCreators(setTrades, dispatch),
	setTickers: bindActionCreators(setTickers, dispatch),
	changeTheme: bindActionCreators(changeTheme, dispatch),
	setChatUnreadMessages: bindActionCreators(setChatUnreadMessages, dispatch),
	setOrderLimits: bindActionCreators(setOrderLimits, dispatch),
	setSnackDialog: bindActionCreators(setSnackDialog, dispatch),
	setCurrencies: bindActionCreators(setCurrencies, dispatch),
	setValidBaseCurrency: bindActionCreators(setValidBaseCurrency, dispatch),
	setConfig: bindActionCreators(setConfig, dispatch),
	setInfo: bindActionCreators(setInfo, dispatch),
	getMe: bindActionCreators(getMe, dispatch),
});

export default connect(
	mapStateToProps,
	mapDispatchToProps
)(Container);
