import React from 'react';
import { connect } from 'react-redux';
import mathjs from 'mathjs';
import { EditWrapper, Image } from 'components';
import STRINGS from 'config/localizedStrings';
import withConfig from 'components/ConfigProvider/withConfig';
import { formatToCurrency } from 'utils/currency';
import {
	BASE_CURRENCY,
	CURRENCY_PRICE_FORMAT,
	DEFAULT_COIN_DATA,
} from 'config/constants';

// const APPROXIMATELY_EQAUL = '\u2248';

const AmountPreview = ({
	amount = 0,
	symbol: token = 'xht',
	labelId = 'STAKE.AMOUNT_LABEL',
	coins,
	icons: ICONS,
	price,
}) => {
	const iconId = `${token.toUpperCase()}_ICON`;
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
	// const formatBase = (value) => `(${APPROXIMATELY_EQAUL} ${format(value, baseSymbol, baseMin)})`;
	const formatBase = (value) => format(value, baseSymbol, baseMin);

	const amountValue = mathjs.multiply(amount, price);

	return (
		<div className="pt-4">
			<div className="bold">
				<EditWrapper stringId={labelId}>{STRINGS[labelId]}</EditWrapper>
			</div>
			<div className="d-flex align-center pt-2">
				<div>
					<Image
						iconId={iconId}
						icon={ICONS[iconId]}
						wrapperClassName="stake-currency-ball"
					/>
				</div>
				<div className="stake-amount pl-2">
					<div>{formatToken(amount)}</div>
					<div className="secondary-text">{formatBase(amountValue)}</div>
				</div>
			</div>
		</div>
	);
};

const mapStateToProps = (store, { symbol }) => {
	const price = store.asset.oraclePrices[symbol];

	return {
		coins: store.app.coins,
		price,
	};
};

export default connect(mapStateToProps)(withConfig(AmountPreview));
