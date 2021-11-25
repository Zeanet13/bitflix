import React from 'react';
import { connect } from 'react-redux';
import { Table, EditWrapper } from 'components';
import STRINGS from 'config/localizedStrings';
import { TABS } from '../index';
import { calculateEsimatedDate } from 'utils/eth';
import Transaction from './Transaction';
import DonutChart from './DonutChart';
import { web3 } from 'config/contracts';
import ConnectWrapper from 'containers/Stake/components/ConnectWrapper';
import { publicInfoSelector } from 'containers/Stake/selector';
import { formatToCurrency } from 'utils/currency';
import {
	BASE_CURRENCY,
	CURRENCY_PRICE_FORMAT,
	DEFAULT_COIN_DATA,
} from 'config/constants';
import Variable from 'containers/Stake/components/Variable';

const TABLE_PAGE_SIZE = 10;

const PublicInfo = ({
	fullname,
	token,
	currentBlock,
	setActiveTab,
	network,
	distributions,
	account,
	coins,
	totalDistributedEarnings,
	totalDistributedEarningsValue,
	clearedUndistributedEarnings,
	unclearedPendingEarnings,
	totalStaked,
	totalStakedValue,
	myStake,
	myStakePercent,
	othersStake,
	othersStakePercent,
}) => {
	const generateDistributionsHeader = () => [
		{
			stringId: 'STAKE_DETAILS.DISTRIBUTIONS.TIME',
			label: STRINGS['STAKE_DETAILS.DISTRIBUTIONS.TIME'],
			key: 'blockNumber',
			renderCell: ({ blockNumber }, key, index) => {
				return (
					<td key={index}>
						<span>{`${STRINGS['STAKE.BLOCK']}: ${blockNumber} `}</span>
						<span className="secondary-text">
							({calculateEsimatedDate(blockNumber, currentBlock, false)})
						</span>
					</td>
				);
			},
		},
		{
			stringId: 'STAKE_DETAILS.DISTRIBUTIONS.TRANSACTION_ID',
			label: STRINGS['STAKE_DETAILS.DISTRIBUTIONS.TRANSACTION_ID'],
			key: 'transactionHash',
			renderCell: ({ transactionHash }, key, index) => {
				return (
					<td key={index}>
						<Transaction id={transactionHash} network={network} />
					</td>
				);
			},
		},
		{
			stringId: 'STAKE_DETAILS.DISTRIBUTIONS.AMOUNT',
			label: STRINGS['STAKE_DETAILS.DISTRIBUTIONS.AMOUNT'],
			key: 'amount',
			renderCell: ({ returnValues: { _amount } }, key, index) => {
				return <td key={index}>{web3.utils.fromWei(_amount)}</td>;
			},
		},
	];
	const { min: baseMin, symbol: baseSymbol = '' } =
		coins[BASE_CURRENCY] || DEFAULT_COIN_DATA;
	const { min: tokenMin, symbol: tokenSymbol = '' } =
		coins[token] || DEFAULT_COIN_DATA;

	const format = (value, symbol, min) =>
		STRINGS.formatString(
			CURRENCY_PRICE_FORMAT,
			formatToCurrency(value, min),
			symbol.toUpperCase()
		);

	const formatToken = (value) => format(value, tokenSymbol, tokenMin);
	const formatBase = (value) => `(~ ${format(value, baseSymbol, baseMin)})`;

	const chartData = [
		{
			symbol: 'mine',
			balancePercentage: myStakePercent,
			balance: myStake,
			stringId: 'STAKE_DETAILS.PUBLIC_INFO.MY_STAKE',
		},
		{
			symbol: 'others',
			balancePercentage: othersStakePercent,
			balance: othersStake,
			stringId: 'STAKE_DETAILS.PUBLIC_INFO.OTHER_STAKE',
		},
	];

	return (
		<div>
			<div className="d-flex justify-content-between">
				<div>
					<div>
						<div className="bold">
							{STRINGS['STAKE_DETAILS.PUBLIC_INFO.TITLE']}
						</div>
						<div className="secondary-text">
							{STRINGS.formatString(
								STRINGS['STAKE_DETAILS.PUBLIC_INFO.SUBTITLE'],
								fullname,
								token.toUpperCase()
							)}
						</div>
					</div>

					<div className="pt-4">
						<div className="bold">
							{STRINGS['STAKE_DETAILS.PUBLIC_INFO.TOTAL_DISTRIBUTED_EARNINGS']}
						</div>
						<div className="d-flex">
							<div>{formatToken(totalDistributedEarnings)}</div>
							<div className="secondary-text pl-2">
								{formatBase(totalDistributedEarningsValue)}
							</div>
						</div>
					</div>

					<div className="pt-4 d-flex">
						<div>
							<div className="bold">
								{
									STRINGS[
										'STAKE_DETAILS.PUBLIC_INFO.CLEARED_UNDISTRIBUTED_EARNINGS'
									]
								}
							</div>
							<div>{formatToken(clearedUndistributedEarnings)}</div>
						</div>
						<div className="secondary-text px-4">|</div>
						<div>
							<div className="bold">
								{
									STRINGS[
										'STAKE_DETAILS.PUBLIC_INFO.UNCLEARED_PENDING_EARNINGS'
									]
								}
							</div>
							<div>{formatToken(unclearedPendingEarnings)}</div>
						</div>
					</div>

					<div className="pt-4">
						<div className="bold">
							{STRINGS['STAKE_DETAILS.PUBLIC_INFO.TOTAL_STAKED']}
						</div>
						<div className="d-flex">
							<div>{formatToken(totalStaked)}</div>
							<div className="secondary-text pl-2">
								{formatBase(totalStakedValue)}
							</div>
						</div>
					</div>

					<div className="pt-4">
						<div className="bold">
							{STRINGS['STAKE_DETAILS.PUBLIC_INFO.REWARD_RATE']}
						</div>
						<div className="secondary-text">
							<Variable />
						</div>
					</div>
				</div>
				<div>
					<div>
						<DonutChart chartData={chartData} />
					</div>

					<div className="pt-4">
						<div className="d-flex align-center">
							<div className="stake-chart-legend mine" />
							<div className="bold">
								{account
									? STRINGS.formatString(
											STRINGS['STAKE_DETAILS.PUBLIC_INFO.MY_STAKE'],
											myStakePercent
									  )
									: STRINGS['STAKE_DETAILS.PUBLIC_INFO.MY_STAKE_PERCENTLESS']}
							</div>
						</div>
						<div className="ml-4 pl-3">
							<ConnectWrapper>
								<div>{formatToken(myStake)}</div>
							</ConnectWrapper>
						</div>
					</div>

					<div className="pt-4">
						<div className="d-flex align-center">
							<div className="stake-chart-legend others" />
							<div className="bold">
								{STRINGS.formatString(
									STRINGS['STAKE_DETAILS.PUBLIC_INFO.OTHER_STAKE'],
									othersStakePercent
								)}
							</div>
						</div>
						<div className="d-flex ml-4 pl-3">
							<div>{formatToken(othersStake)}</div>
							<div className="pl-2">
								(
								<span
									className="blue-link underline-text pointer"
									onClick={() => setActiveTab(TABS.MY_STAKING.key)}
								>
									<EditWrapper stringId="STAKE_DETAILS.VIEW">
										{STRINGS['STAKE_DETAILS.VIEW']}
									</EditWrapper>
								</span>
								)
							</div>
						</div>
					</div>
				</div>
			</div>
			<div className="bold">
				<EditWrapper stringId="STAKE_DETAILS.MY_STAKING.EVENTS_TITLE">
					{STRINGS['STAKE_DETAILS.MY_STAKING.EVENTS_TITLE']}
				</EditWrapper>
			</div>
			<div>
				<Table
					className="transactions-history-table"
					data={distributions}
					count={distributions.length}
					headers={generateDistributionsHeader()}
					withIcon={false}
					pageSize={TABLE_PAGE_SIZE}
					rowKey={(data) => {
						return data.id;
					}}
					title={STRINGS['STAKE_DETAILS.MY_STAKING.EVENTS_TITLE']}
					handleNext={() => {}}
					jumpToPage={0}
					displayPaginator={false}
					showHeaderNoData={true}
				/>
			</div>
			{distributions.length !== 0 && (
				<div className="d-flex content-center">
					<div
						className="blue-link underline-text pointer"
						onClick={() => setActiveTab(TABS.DISTRIBUTIONS.key)}
					>
						<EditWrapper stringId="STAKE_DETAILS.VIEW_MORE">
							{STRINGS['STAKE_DETAILS.VIEW_MORE']}
						</EditWrapper>
					</div>
				</div>
			)}
		</div>
	);
};

const mapStateToProps = (store) => ({
	coins: store.app.coins,
	account: store.stake.account,
	network: store.stake.network,
	currentBlock: store.stake.currentBlock,
	distributions: store.stake.distributions,
	publicInfo: store.stake.publicInfo,
	...publicInfoSelector(store),
});

export default connect(mapStateToProps)(PublicInfo);
