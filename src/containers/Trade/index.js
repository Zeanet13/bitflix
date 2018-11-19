import React, { Component } from 'react';
import { connect } from 'react-redux';
import EventListener from 'react-event-listener';
import classnames from 'classnames';
import { bindActionCreators } from 'redux';
import { SubmissionError, change } from 'redux-form';
import { isMobile } from 'react-device-detect';
import { Link } from 'react-router';

import { ICONS } from '../../config/constants';
import { IconTitle } from '../../components';
import {
	submitOrder,
	cancelOrder,
	cancelAllOrders
} from '../../actions/orderAction';
import { getUserTrades } from '../../actions/walletActions';
import {
	changePair,
	setNotification,
	NOTIFICATIONS
} from '../../actions/appActions';

import { isLoggedIn } from '../../utils/token';
import TradeBlock from './components/TradeBlock';
import TradeBlockTabs from './components/TradeBlockTabs';
import Orderbook from './components/Orderbook';
import OrderEntry from './components/OrderEntry';
import { FORM_NAME } from './components/OrderEntryForm';
import ActiveOrders from './components/ActiveOrders';
import UserTrades from './components/UserTrades';
import TradeHistory from './components/TradeHistory';
import PriceChart from './components/PriceChart';
import MobileTrade from './MobileTrade';
import MobileChart from './MobileChart';
import MobileOrders from './MobileOrders';

import { ActionNotification, Loader, MobileBarTabs } from '../../components';

import STRINGS from '../../config/localizedStrings';

class Trade extends Component {
	state = {
		activeTab: 0,
		chartHeight: 0,
		chartWidth: 0,
		symbol: '',
	};

	componentWillMount() {
		this.setSymbol(this.props.routeParams.pair);
	}

	componentWillReceiveProps(nextProps) {
		if (nextProps.routeParams.pair !== this.props.routeParams.pair) {
			this.setSymbol(nextProps.routeParams.pair);
		}
	}

	setSymbol = (symbol = '') => {
		this.props.changePair(symbol);
		this.setState({ symbol: '' }, () => {
			setTimeout(() => {
				this.setState({ symbol });
			}, 1000);
		});
	};

	onSubmitOrder = (values) => {
		return submitOrder(values)
			.then((body) => {})
			.catch((err) => {
				// console.log('error', err);
				const _error = err.response.data
					? err.response.data.message
					: err.message;
				throw new SubmissionError({ _error });
			});
	};

	setChartRef = (el) => {
		if (el) {
			this.chartBlock = el;
			this.onResize();
		}
	};

	goToTransactionsHistory = () => {
		this.props.router.push('transactions');
	};

	goToPair = (pair) => {
		this.props.router.push(`/trade/${pair}`);
	};

	onResize = () => {
		if (this.chartBlock) {
			this.setState({
				chartHeight: this.chartBlock.offsetHeight || 0,
				chartWidth: this.chartBlock.offsetWidth || 0
			});
		}
	};

	openCheckOrder = (order, onConfirm) => {
		const { setNotification, fees, pairData } = this.props;
		setNotification(NOTIFICATIONS.NEW_ORDER, {
			order,
			onConfirm,
			fees,
			pairData
		});
	};

	onPriceClick = (price) => {
		this.props.change(FORM_NAME, 'price', price);
	};

	onAmountClick = (size) => {
		this.props.change(FORM_NAME, 'size', size);
	};

	setActiveTab = (activeTab) => {
		this.setState({ activeTab });
	};

	cancelAllOrders = () => {
		this.props.cancelAllOrders(this.state.symbol);
	}

	render() {
		const {
			pair,
			pairData,
			tradeHistory,
			orderbookReady,
			asks,
			bids,
			activeOrders,
			userTrades,
			cancelOrder,
			balance,
			marketPrice,
			activeLanguage,
			activeTheme,
			settings,
			orderLimits,
			pairs
		} = this.props;
		const { chartHeight, chartWidth, symbol, activeTab, isLogged } = this.state;

		if (symbol !== pair || !pairData) {
			return <Loader background={false} />;
		}

		const USER_TABS = [
			{
				title: STRINGS.ORDERS,
				children: isLoggedIn() ? <ActiveOrders orders={activeOrders} onCancel={cancelOrder} /> :
				<div className='text-center'>
					<IconTitle
						iconPath={activeTheme==='white' ? ICONS.ACTIVE_TRADE_LIGHT : ICONS.ACTIVE_TRADE_DARK}
						textType="title"
						className="w-100"
						useSvg={true}
					/>
					<div>
						{STRINGS.formatString(
							STRINGS.ACTIVE_TRADES,
							<Link to="/login" className={classnames('blue-link', 'dialog-link', 'pointer')} >
								{STRINGS.SIGN_IN}
							</Link>
						)}
					</div>
				</div>,
				titleAction: isLoggedIn() ? (activeOrders.length > 0 && (
					<ActionNotification
						text={STRINGS.CANCEL_ALL}
						iconPath={ICONS.CANCEL_CROSS_ACTIVE}
						onClick={this.cancelAllOrders}
						status=""
						useSvg={true}
					/>)
				
				) : ''
			},
			{
				title: STRINGS.TRADES,
				children:   (
					isLoggedIn() ?
						<UserTrades trades={userTrades} pair={pair} pairData={pairData} pairs={pairs} /> :
					<div className='text-center'>
						<IconTitle
							iconPath={activeTheme ==='dark' ? ICONS.TRADE_HISTORY_DARK: ICONS.TRADE_HISTORY_LIGHT }
							textType="title"
							className="w-100"
							useSvg={true}
						/>
						<div>
							{STRINGS.formatString(
								STRINGS.ACTIVE_TRADES,
								<Link to="/login" className={classnames('blue-link', 'dialog-link', 'pointer')} >
									{STRINGS.SIGN_IN}
								</Link>
							)}
						</div>
					</div>
				),
				titleAction:  isLoggedIn() ? (
					<ActionNotification
						text={STRINGS.TRADE_HISTORY}
						iconPath={ICONS.ARROW_TRANSFER_HISTORY_ACTIVE}
						onClick={this.goToTransactionsHistory}
						status=""
						useSvg={true}
					/>
				) : ''
			}
		];

		// TODO get right fiat pair
		const orderbookProps = {
			symbol,
			pairData,
			fiatSymbol: STRINGS.FIAT_SHORTNAME,
			asks,
			bids,
			onPriceClick: this.onPriceClick,
			onAmountClick: this.onAmountClick
		};

		const mobileTabs = [
			{
				title: STRINGS.TRADE_TAB_CHART,
				content: (
					<MobileChart
						pair={pair}
						pairData={pairData}
						tradeHistory={tradeHistory}
						activeLanguage={activeLanguage}
						activeTheme={activeTheme}
						symbol={symbol}
						goToPair={this.goToPair}
						orderLimits={orderLimits}
					/>
				)
			},
			{
				title: STRINGS.TRADE_TAB_TRADE,
				content: (
					<MobileTrade
						orderbookProps={orderbookProps}
						symbol={symbol}
						asks={asks}
						bids={bids}
						balance={balance}
						marketPrice={marketPrice}
						settings={settings}
						orderbookReady={orderbookReady}
						openCheckOrder={this.openCheckOrder}
						onSubmitOrder={this.onSubmitOrder}
						goToPair={this.goToPair}
						pair={pair}
					/>
				)
			},
			{
				title: STRINGS.TRADE_TAB_ORDERS,
				content: (
					<MobileOrders
						isLoggedIn={isLoggedIn()}
						activeOrders={activeOrders}
						cancelOrder={cancelOrder}
						cancelAllOrders={cancelAllOrders}
						goToTransactionsHistory={this.goToTransactionsHistory}
						pair={pair}
						pairData={pairData}
						pairs={pairs}
						userTrades={userTrades}
						activeTheme={activeTheme}
					/>
				)
			}
		];
		return (
			<div className={classnames('trade-container', 'd-flex')}>
				{isMobile ? (
					<div className="">
						<MobileBarTabs
							tabs={mobileTabs}
							activeTab={activeTab}
							setActiveTab={this.setActiveTab}
						/>
						<div className="content-with-bar d-flex">
							{mobileTabs[activeTab].content}
						</div>
					</div>
				) : (
					<div className={classnames('trade-container', 'd-flex')}>
						<EventListener target="window" onResize={this.onResize} />
						<div
							className={classnames(
								'trade-col_side_wrapper',
								'flex-column',
								'd-flex',
								'apply_rtl'
							)}
						>
							<TradeBlock isLoggedIn={isLoggedIn()} title={STRINGS.ORDERBOOK} pairData={pairData} pair={pair}>
								{orderbookReady && <Orderbook {...orderbookProps} />}
							</TradeBlock>
						</div>
						<div
							className={classnames(
								'trade-col_main_wrapper',
								'flex-column',
								'd-flex',
								'f-1',
								'overflow-x'
							)}
						>
							<div
								className={classnames(
									'trade-main_content',
									'flex-auto',
									'd-flex'
								)}
							>
								<div
									className={classnames(
										'trade-col_action_wrapper',
										'flex-column',
										'd-flex',
										'apply_rtl'
									)}
								>
									<TradeBlock title={STRINGS.ORDER_ENTRY} pairData={pairData} pair={pair}>
										<OrderEntry
											submitOrder={this.onSubmitOrder}
											openCheckOrder={this.openCheckOrder}
											symbol={symbol}
											balance={balance}
											asks={asks}
											bids={bids}
											marketPrice={marketPrice}
											showPopup={settings.orderConfirmationPopup}
										/>
									</TradeBlock>
								</div>
								<TradeBlock
									title={STRINGS.CHART}
									setRef={this.setChartRef}
									className="f-1 overflow-x"
									pairData={pairData} 
									pair={pair}
								>
									{pair &&
										chartHeight > 0 && (
											<PriceChart
												height={chartHeight}
												width={chartWidth}
												theme={activeTheme}
												pair={pair}
												pairBase={pairData.pair_base}
												orderLimits={orderLimits}
											/>
										)}
								</TradeBlock>
							</div>
							<div
								className={classnames(
									'trade-tabs_content',
									'd-flex',
									'flex-column',
									'apply_rtl'
								)}
							>
								<TradeBlockTabs content={USER_TABS} /> 
							</div>
						</div>
						<div
							className={classnames(
								'trade-col_side_wrapper',
								'flex-column',
								'd-flex',
								'apply_rtl'
							)}
						>
							<TradeBlock title={STRINGS.TRADE_HISTORY}>
								<TradeHistory data={tradeHistory} language={activeLanguage} />
							</TradeBlock>
						</div>
					</div>
				)}
			</div>
		);
	}
}

Trade.defaultProps = {};

const mapStateToProps = (store) => {
	const pair = store.app.pair;
	const pairData = store.app.pairs[pair];
	const { asks, bids } = store.orderbook.pairsOrderbooks[pair];
	const tradeHistory = store.orderbook.pairsTrades[pair];
	const marketPrice = tradeHistory && tradeHistory.length > 0 ? tradeHistory[0].price : 1;
	const userTrades = store.wallet.latestUserTrades.filter(
		({ symbol }) => symbol === pair
	);
	const activeOrders = store.order.activeOrders.filter(
		({ symbol }) => symbol === pair
	);
	const fees = store.user.fees[pair];
	return {
		pair,
		pairData,
		pairs: store.app.pairs,
		balance: store.user.balance,
		orderbookReady: true,
		tradeHistory,
		asks,
		bids,
		marketPrice,
		activeOrders,
		userTrades,
		activeLanguage: store.app.language,
		activeTheme: store.app.theme,
		fees,
		settings: store.user.settings,
		orderLimits: store.app.orderLimits
	};
};

const mapDispatchToProps = (dispatch) => ({
	getUserTrades: (symbol) => dispatch(getUserTrades({ symbol })),
	cancelOrder: bindActionCreators(cancelOrder, dispatch),
	cancelAllOrders: bindActionCreators(cancelAllOrders, dispatch),
	setNotification: bindActionCreators(setNotification, dispatch),
	changePair: bindActionCreators(changePair, dispatch),
	change: bindActionCreators(change, dispatch)
});

export default connect(mapStateToProps, mapDispatchToProps)(Trade);