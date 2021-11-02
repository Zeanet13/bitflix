import React from 'react';
import { connect } from 'react-redux';
import { CurrencyBall } from '../';
import { formatToCurrency } from '../../utils/currency';
import { DEFAULT_COIN_DATA } from '../../config/constants';

const CurrencyBallWithPrice = ({
	symbol,
	amount,
	price,
	size = 'm',
	coins = {},
	min,
}) => {
	const { name, ...rest } = coins[symbol] || DEFAULT_COIN_DATA;
	const minValue = min ? min : rest.min;
	// const baseCoin = coins[BASE_CURRENCY] || DEFAULT_COIN_DATA;
	const currencyShortName = rest.symbol ? rest.symbol.toUpperCase() : name;
	return (
		<div className="with_price-block_amount d-flex direction_ltr">
			<CurrencyBall name={currencyShortName} symbol={symbol} size={size} />
			<div className="with_price-block_amount-value d-flex">
				{`${formatToCurrency(amount, minValue)}`}
				{/* {symbol !== BASE_CURRENCY && price && (
					<div className={`with_price-block_amount-value-${BASE_CURRENCY.toLowerCase()} d-flex align-items-end`}>
						{` ~ ${formatToCurrency(
							calculatePrice(amount, symbol), baseCoin.min
						)} ${baseCoin.symbol.toUpperCase()}`}
					</div>
				)} */}
			</div>
		</div>
	);
};

const mapStateToProps = (state) => ({
	coins: state.app.coins,
});

export default connect(mapStateToProps)(CurrencyBallWithPrice);
