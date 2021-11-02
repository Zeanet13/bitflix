import React from 'react';
import { connect } from 'react-redux';
import { Table } from 'components';
import STRINGS from 'config/localizedStrings';
import { calculateEsimatedDate } from 'utils/eth';
import Transaction from './Transaction';
import { web3 } from 'config/contracts';

const TABLE_PAGE_SIZE = 10;

const Distributions = ({ token, currentBlock, network, distributions }) => {
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

	return (
		<div>
			<div className="d-flex">
				<div>
					<div>
						<div className="bold">
							{STRINGS.formatString(
								STRINGS['STAKE_DETAILS.DISTRIBUTIONS.TITLE'],
								token.toUpperCase()
							)}
						</div>
						<div className="secondary-text">
							{STRINGS.formatString(
								STRINGS['STAKE_DETAILS.DISTRIBUTIONS.SUBTITLE'],
								token.toUpperCase()
							)}
						</div>
					</div>
				</div>
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
				/>
			</div>
		</div>
	);
};

const mapStateToProps = (store) => ({
	network: store.stake.network,
	currentBlock: store.stake.currentBlock,
	distributions: store.stake.distributions,
});

export default connect(mapStateToProps)(Distributions);
