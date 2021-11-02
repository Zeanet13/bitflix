import React, { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import mathjs from 'mathjs';
import { Button as AntBtn } from 'antd';
import {
	connectWallet,
	loadBlockchainData,
	getCurrentBlock,
	generateTableData,
	getAllPeriods,
	getAllUserStakes,
} from 'actions/stakingActions';
import { setNotification, NOTIFICATIONS } from 'actions/appActions';
import { Link } from 'react-router';
import { web3 } from 'config/contracts';
import STRINGS from 'config/localizedStrings';
import {
	IconTitle,
	HeaderSection,
	EditWrapper,
	Button,
	ProgressBar,
} from 'components';
import withConfig from 'components/ConfigProvider/withConfig';
import Image from 'components/Image';

import { userActiveStakesSelector } from './selector';
import { getEstimatedRemainingTime, calculateEsimatedDate } from 'utils/eth';
import Account from './components/Account';
import { formatToCurrency } from 'utils/currency';
import {
	BASE_CURRENCY,
	CURRENCY_PRICE_FORMAT,
	DEFAULT_COIN_DATA,
} from 'config/constants';

const ConnectWalletLink = (props) => (
	<span className="blue-link pointer underline-text" {...props}>
		{STRINGS['STAKE.CONNECT_WALLET']}
	</span>
);

class Stake extends Component {
	componentWillMount() {
		const { loadBlockchainData, getAllPeriods, getCurrentBlock } = this.props;
		loadBlockchainData();
		getCurrentBlock();
		getAllPeriods();
	}

	componentDidUpdate(prevProps) {
		const { account, generateTableData, getAllUserStakes } = this.props;
		if (!prevProps.account && !!account) {
			generateTableData(account);
			getAllUserStakes(account);
		}
	}

	componentDidMount() {
		this.setBlockNumberInterval();
	}

	componentWillUnmount() {
		this.clearBlockNumberInterval();
	}

	setBlockNumberInterval = () => {
		const { getCurrentBlock } = this.props;
		this.BlockNumberIntervalHandler = setInterval(getCurrentBlock, 5000);
	};

	clearBlockNumberInterval = () => {
		clearInterval(this.BlockNumberIntervalHandler);
	};

	smartRender = (element) => {
		const { account, connectWallet } = this.props;
		return account ? element : <ConnectWalletLink onClick={connectWallet} />;
	};

	startStakingProcess = (tokenData) => {
		const { symbol } = tokenData;
		const { coins, setNotification } = this.props;
		const { fullname } = coins[symbol];
		setNotification(NOTIFICATIONS.STAKE, {
			tokenData: { ...tokenData, fullname },
		});
	};

	startEarlyUnstakingProcess = (stakeData) => {
		const { setNotification } = this.props;
		setNotification(NOTIFICATIONS.EARLY_UNSTAKE, { stakeData });
	};

	startUnstakingProcess = (stakeData) => {
		const { setNotification } = this.props;
		setNotification(NOTIFICATIONS.UNSTAKE, { stakeData });
	};

	getValue = (balances, prices) => {
		let value = 0;
		Object.entries(balances).forEach(([symbol, balance]) => {
			value = mathjs.sum(
				mathjs.multiply(
					balance,
					!prices[symbol] || prices[symbol] === -1 ? 0 : prices[symbol]
				),
				value
			);
		});

		return value;
	};

	render() {
		const {
			icons: ICONS,
			coins,
			connectWallet,
			account,
			network,
			currentBlock,
			stakables,
			activeStakes,
			activeStakesCount,
			totalUserStakes,
			totalUserEarnings,
			balance,
			prices,
		} = this.props;
		const { smartRender } = this;

		const totlStakes = this.getValue(totalUserStakes, prices);
		const totalEarnings = this.getValue(totalUserEarnings, prices);

		const { min, symbol = '' } = coins[BASE_CURRENCY] || DEFAULT_COIN_DATA;

		const totalStakesString = STRINGS.formatString(
			CURRENCY_PRICE_FORMAT,
			symbol.toUpperCase(),
			formatToCurrency(totlStakes, min)
		);

		const totalEarningsString = STRINGS.formatString(
			CURRENCY_PRICE_FORMAT,
			symbol.toUpperCase(),
			formatToCurrency(totalEarnings, min)
		);

		return (
			<div className="presentation_container apply_rtl wallet-wrapper">
				<div className="d-flex align-end justify-content-between">
					<IconTitle
						stringId="STAKE.TITLE"
						text={STRINGS['STAKE.TITLE']}
						iconPath={ICONS['TAB_WALLET']}
						iconId="TAB_WALLET"
						textType="title"
					/>
					<Account account={account} balance={balance} network={network} />
				</div>
				<div className="wallet-container no-border">
					<div className="wallet-assets_block">
						<div className="d-flex justify-content-between align-start">
							<div>
								<HeaderSection
									stringId="STAKE.DEFI_TITLE"
									title={STRINGS['STAKE.DEFI_TITLE']}
								>
									<div className="header-content">
										<div>
											<EditWrapper stringId="STAKE.DEFI_TEXT">
												{STRINGS['STAKE.DEFI_TEXT']}
											</EditWrapper>
										</div>
									</div>
								</HeaderSection>
								<div className="secondary-text">
									{STRINGS.formatString(
										STRINGS['STAKE.CURRENT_ETH_BLOCK'],
										<span className="blue-link">{currentBlock}</span>
									)}
								</div>
							</div>
							<div
								className="secondary-text"
								style={{
									minWidth: 'max-content',
									paddingTop: '0.5rem',
									textAlign: 'right',
									marginLeft: '3rem',
								}}
							>
								<div>
									<div>{STRINGS['STAKE.ESTIMATED_STAKED']}</div>
									<div>{smartRender(totalStakesString)}</div>
									<div className="kit-divider" />
								</div>
								<div>
									<div>{STRINGS['STAKE.ESTIMATED_EARNINGS']}</div>
									<div>{smartRender(totalEarningsString)}</div>
									<div className="kit-divider" />
								</div>
							</div>
						</div>
						<table className="wallet-assets_block-table">
							<thead>
								<tr className="table-bottom-border">
									<th />
									<th>
										<EditWrapper stringId="STAKE_TABLE.CURRENCY">
											{STRINGS['STAKE_TABLE.CURRENCY']}
										</EditWrapper>
									</th>
									<th>
										<EditWrapper stringId="STAKE_TABLE.AVAILABLE">
											{STRINGS['STAKE_TABLE.AVAILABLE']}
										</EditWrapper>
									</th>
									<th>
										<EditWrapper stringId="STAKE_TABLE.TOTAL">
											{STRINGS['STAKE_TABLE.TOTAL']}
										</EditWrapper>
									</th>
									<th>
										<EditWrapper stringId="STAKE_TABLE.REWARD_RATE">
											{STRINGS['STAKE_TABLE.REWARD_RATE']}
										</EditWrapper>
									</th>
									<th>
										<EditWrapper stringId="STAKE_TABLE.EARNING">
											{STRINGS['STAKE_TABLE.EARNINGS']}
										</EditWrapper>
									</th>
									<th>
										<EditWrapper stringId="STAKE_TABLE.STAKE">
											{STRINGS['STAKE_TABLE.STAKE']}
										</EditWrapper>
									</th>
								</tr>
							</thead>
							<tbody>
								{stakables.map((tokenData, index) => {
									const { symbol, available } = tokenData;
									const { fullname } = coins[symbol];
									const iconId = `${symbol.toUpperCase()}_ICON`;
									return (
										<tr className="table-row table-bottom-border" key={index}>
											<td />
											<td className="td-name td-fit">
												<div className="d-flex align-items-center">
													<Link to={`/stake/details/${symbol.toLowerCase()}`}>
														<Image
															iconId={iconId}
															icon={ICONS[iconId]}
															wrapperClassName="currency-ball"
															imageWrapperClassName="currency-ball-image-wrapper"
														/>
													</Link>
													<Link to={`/stake/details/${symbol.toLowerCase()}`}>
														{fullname}
													</Link>
												</div>
											</td>
											<td>{smartRender(available)}</td>
											<td>{smartRender(totalUserStakes[symbol])}</td>
											<td>{smartRender(STRINGS['STAKE_TABLE.VARIABLE'])}</td>
											<td>{smartRender(totalUserEarnings[symbol])}</td>
											<td>
												<div className="d-flex content-center">
													<AntBtn
														className="stake-btn"
														type="primary"
														ghost
														onClick={() => this.startStakingProcess(tokenData)}
														disabled={!account}
													>
														{STRINGS['STAKE_TABLE.STAKE']}
													</AntBtn>
												</div>
											</td>
										</tr>
									);
								})}
							</tbody>
						</table>
						{account && activeStakesCount !== 0 && (
							<table className="wallet-assets_block-table mt-4">
								<thead>
									<tr className="table-bottom-border">
										<th />
										<th>
											<EditWrapper stringId="STAKE_LIST.AMOUNT">
												{STRINGS['STAKE_LIST.AMOUNT']}
											</EditWrapper>
										</th>
										<th>
											<EditWrapper stringId="STAKE_LIST.DURATION">
												{STRINGS['STAKE_LIST.DURATION']}
											</EditWrapper>
										</th>
										<th>
											<EditWrapper stringId="STAKE_LIST.START">
												{STRINGS['STAKE_LIST.START']}
											</EditWrapper>
										</th>
										<th>
											<EditWrapper stringId="STAKE_LIST.END">
												{STRINGS['STAKE_LIST.END']}
											</EditWrapper>
										</th>
										<th>
											<EditWrapper stringId="STAKE_LIST.EARNINGS">
												{STRINGS['STAKE_LIST.EARNINGS']}
											</EditWrapper>
										</th>
										<th>
											<EditWrapper stringId="STAKE_LIST.STAKE">
												{STRINGS['STAKE_LIST.STAKE']}
											</EditWrapper>
										</th>
									</tr>
								</thead>
								<tbody>
									{Object.entries(activeStakes).map(([symbol, stakes]) =>
										stakes.map(
											([
												weiAmount,
												period,
												startBlock,
												reward,
												closeBlock,
												index,
											]) => {
												const amount = web3.utils.fromWei(weiAmount);
												const calculatedCloseBlock = mathjs.sum(
													startBlock,
													period
												);
												const remainingBlocks = mathjs.max(
													mathjs.subtract(calculatedCloseBlock, currentBlock),
													0
												);
												const estimatedLeftover = getEstimatedRemainingTime(
													remainingBlocks
												);
												const isEarly = mathjs.larger(
													calculatedCloseBlock,
													currentBlock
												);

												const partial = mathjs.subtract(
													currentBlock,
													startBlock
												);

												const total = mathjs.number(period);

												const progressStatusText = remainingBlocks
													? `~${estimatedLeftover.join(' ')}`
													: 'Completed';

												const data = {
													amount,
													partial,
													total,
													reward,
													symbol,
													index,
													progressStatusText,
												};

												const btnProps = {
													type: 'primary',
													className: 'stake-btn',
													ghost: true,
													danger: !!isEarly,
													onClick: isEarly
														? () => this.startEarlyUnstakingProcess(data)
														: () => this.startUnstakingProcess(data),
													children: isEarly ? 'UNSTAKE EARLY' : 'UNSTAKE',
												};
												return (
													<tr
														className="table-row table-bottom-border"
														key={`${symbol}_${index}`}
													>
														<td />
														<td>{amount}</td>
														<td>
															<div className="d-flex">
																<ProgressBar partial={partial} total={total} />
																<div className="px-2 align-center">
																	{progressStatusText}
																</div>
															</div>
														</td>
														<td>
															<div>{`${STRINGS['STAKE.BLOCK']}: ${startBlock}`}</div>
															<div className="secondary-text">
																{calculateEsimatedDate(
																	startBlock,
																	currentBlock
																)}
															</div>
														</td>
														<td>
															<div>{`${STRINGS['STAKE.BLOCK']}: ${calculatedCloseBlock}`}</div>
															<div className="secondary-text">
																{calculateEsimatedDate(
																	calculatedCloseBlock,
																	currentBlock
																)}
															</div>
														</td>
														<td>{reward}</td>
														<td className="text-align-center">
															<div className="d-flex content-center">
																<AntBtn {...btnProps} />
															</div>
														</td>
													</tr>
												);
											}
										)
									)}
								</tbody>
							</table>
						)}
					</div>
				</div>
				{!account && (
					<div className="btn-wrapper">
						<Button
							label={STRINGS['STAKE.CONNECT_WALLET']}
							onClick={connectWallet}
							className="my-4"
						/>
					</div>
				)}
			</div>
		);
	}
}

const mapStateToProps = (store) => ({
	coins: store.app.coins,
	account: store.stake.account,
	network: store.stake.network,
	currentBlock: store.stake.currentBlock,
	stakables: store.stake.stakables,
	periods: store.stake.periods,
	balance: store.stake.balance,
	prices: store.asset.oraclePrices,
	...userActiveStakesSelector(store),
});

const mapDispatchToProps = (dispatch) => ({
	connectWallet: bindActionCreators(connectWallet, dispatch),
	loadBlockchainData: bindActionCreators(loadBlockchainData, dispatch),
	getCurrentBlock: bindActionCreators(getCurrentBlock, dispatch),
	generateTableData: bindActionCreators(generateTableData, dispatch),
	getAllPeriods: bindActionCreators(getAllPeriods, dispatch),
	getAllUserStakes: bindActionCreators(getAllUserStakes, dispatch),
	setNotification: bindActionCreators(setNotification, dispatch),
});

export default connect(mapStateToProps, mapDispatchToProps)(withConfig(Stake));
