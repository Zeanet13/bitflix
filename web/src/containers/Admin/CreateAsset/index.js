import React, { Component } from 'react';
import { connect } from 'react-redux';
import { message } from 'antd';
import _toLower from 'lodash/toLower';
import _get from 'lodash/get';
import _cloneDeep from 'lodash/cloneDeep';
import _forEach from 'lodash/forEach';

import Step1 from './Step1';
import Step2 from './Step2';
import Step3 from './Step3';
import Step4 from './Step4';
import Step5 from './Step5';
import Step6 from './Step6';
import AssetConfig from './AssetConfig';
import AssetParams from './AssetParams';
import AssetPrice from './AssetPrice';
import Final from './Final';
import EditAsset from './EditAsset';
import BurnModal from './Burn';
import CoinLimited from './CoinLimited';

import './index.css';

export const default_coin_data = {
	fullname: '',
	symbol: '',
	logo: '',
	withdrawal_fee: 0.001,
	min: 0.001,
	max: 10000,
	increment_unit: 0.001,
	// active: true,
	allow_deposit: true,
	allow_withdrawal: true,
	estimated_price: 1,
	meta: {
		color: '#000',
		decimal_points: 18,
		supply: 0,
	},
	is_public: true,
};

class CreateAsset extends Component {
	constructor(props) {
		super(props);
		this.state = {
			currentScreen: 'step1',
			searchValue: '',
			selectedCoin: '',
			selectedCoinData: {},
			coins: [],
			coinFormData: _cloneDeep(default_coin_data),
			prevCoinData: {},
			// assetType: 'existing_asset',
			activeTab: '0',
			savePresetAsset: false,
		};
	}

	componentDidMount() {
		if (this.props.coins && this.props.coins.length) {
			this.setCurrentPageAssets(this.state.activeTab);
		}
		if (this.props.isEdit) {
			this.setState({
				currentScreen: 'step3',
				coinFormData: {
					..._cloneDeep(default_coin_data),
					...this.props.editAsset,
				},
			});
		}
		if (this.props.isConfigureEdit) {
			this.setState({
				currentScreen: this.props.editConfigureScreen,
				coinFormData: {
					..._cloneDeep(default_coin_data),
					...this.props.editAsset,
				},
			});
		}
	}

	setCurrentPageAssets = (activeKey) => {
		const coinKeys = this.props.exchangeCoins.map((data) => data.symbol);
		// const coinKeys = exchangeCoins.map((data) => data.symbol);
		let coins = this.props.coins.filter(
			// let coins = allCoins.filter(
			(val) =>
				!coinKeys.includes(val.symbol) &&
				val.verified &&
				_toLower(val.issuer) === 'hollaex'
		);
		if (activeKey === '1') {
			coins = this.props.coins.filter(
				(val) =>
					!coinKeys.includes(val.symbol) &&
					val.verified &&
					_toLower(val.issuer) !== 'hollaex'
			);
		}
		const selectedCoinData = coins[0] || {};
		this.setState({
			coins,
			coinFormData: selectedCoinData,
			selectedCoinData,
			selectedCoin: selectedCoinData.symbol || '',
		});
	};

	handleChange = (e) => {
		const coinFormData = {
			...this.state.coinFormData,
			[e.target.name]: e.target.value,
		};
		this.setState({
			[e.target.name]: e.target.value,
			coinFormData,
		});
		this.props.updateFormData(e.target.name, e.target.value);
		this.props.handleEditDataCallback(coinFormData);
	};

	handleMetaChange = (value, name) => {
		const coinFormData = {
			...this.state.coinFormData,
		};
		if (!coinFormData.meta) {
			coinFormData.meta = {};
		}
		coinFormData.meta[name] = value;
		// if (name === 'is_blockchain' && value) {
		//     coinFormData.meta.is_fiat = false;
		// }
		this.setState({
			[name]: value,
			coinFormData,
		});
		this.props.handleEditDataCallback(coinFormData);
		this.props.updateFormData('meta', coinFormData.meta);
	};

	handleCheckChange = (e) => {
		const coinFormData = {
			...this.state.coinFormData,
			[e.target.name]: e.target.checked,
		};
		this.setState({
			[e.target.name]: e.target.checked,
			coinFormData,
		});
		this.props.handleEditDataCallback(coinFormData);
		this.props.updateFormData(e.target.name, e.target.checked);
	};

	handleChangeNumber = (value, name) => {
		const coinFormData = {
			...this.state.coinFormData,
			[name]: value,
		};
		this.setState({
			[name]: value,
			coinFormData,
		});
		this.props.handleEditDataCallback(coinFormData);
		this.props.updateFormData(name, value);
	};

	handleSelectChange = (value, name) => {
		const coinFormData = {
			...this.state.coinFormData,
			[name]: value,
		};
		this.setState({
			[name]: value,
			coinFormData,
		});
		this.props.handleEditDataCallback(coinFormData);
		this.props.updateFormData(name, value);
	};

	handleScreenChange = (screen) => {
		if (screen === 'final') {
			this.props.handleWidth(650);
		} else {
			this.props.handleWidth();
		}
		this.setState({ currentScreen: screen });
	};

	handleFileChange = async (event, name) => {
		const value = event.target.value;
		if (
			value &&
			((value.split('.')[1].toUpperCase() === 'JPG' || value.toLowerCase().includes('jpg')) ||
				(value.split('.')[1].toUpperCase() === 'JPEG' || value.toLowerCase().includes('jpeg')) ||
				(value.split('.')[1].toUpperCase() === 'PNG' || value.toLowerCase().includes('png')))
		) {
			const file = event.target.files[0];
			if (file) {
				// const base64Url = await new Promise((resolve, reject) => {
				// 	const reader = new FileReader();
				// 	reader.readAsDataURL(file);
				// 	reader.onload = () => resolve(reader.result);
				// 	reader.onerror = (error) => reject(error);
				// });
				const coinFormData = {
					...this.state.coinFormData,
					[name]: file,
					logoFile: file,
					iconName: file.name,
				};
				this.props.updateFormData(name, file);
				this.props.updateFormData('logoFile', file);
				this.props.updateFormData('iconName', file.name);
				this.setState({
					[name]: file,
					coinFormData,
				});
			}
		} else {
			message.warn(
				'File format is invalid. Upload a validfile with jpeg, jpg and png extensions'
			);
		}
	};

	handleBulkUpdate = (data = {}) => {
		const coinFormData = {
			...this.state.coinFormData,
			...data,
		};
		if (data.symbol) {
			coinFormData.code = data.symbol.toLowerCase();
		}
		this.setState({
			coinFormData,
		});
		let formValues = { ...data };
		if (data.symbol) {
			formValues = { ...data, code: data.symbol.toLowerCase() };
		}
		_forEach(formValues, (formValue, key) => {
			this.props.updateFormData(key, formValue);
		});
		this.props.handleEditDataCallback(coinFormData);
	};

	handleSelectCoin = (coin) => {
		this.setState({
			selectedCoin: coin.symbol,
			selectedCoinData: coin,
			currentScreen: 'step1',
		});
	};

	handleSearch = (e) => {
		const { coins = [] } = this.props;
		const searchValue = e.target.value ? e.target.value.toLowerCase() : '';
		const filteredData = coins.filter((coin) => {
			return (
				coin.symbol.toLowerCase().includes(searchValue) ||
				coin.fullname.toLowerCase().includes(searchValue) ||
				(coin.address && coin.address.includes(searchValue))
			);
		});
		this.setState({ searchValue, coins: filteredData });
	};

	handleBack = (isFinalBack = false) => {
		const { id, type } = this.state.coinFormData || {};
		if (this.state.currentScreen === 'final') {
			if (this.state.savePresetAsset && isFinalBack) {
				this.handleScreenChange('step7');
			} else if (id && !isFinalBack) {
				this.handleScreenChange('step1');
			} else {
				this.handleScreenChange('step9');
			}
		} else if (this.state.currentScreen === 'step7') {
			if (type === 'blockchain') {
				this.handleScreenChange('step4');
				// this.handleRevertAsset();
			} else if (type === 'fiat') {
				this.handleScreenChange('step6');
			} else {
				this.handleScreenChange('step3');
			}
		}
	};

	handleRevertAsset = () => {
		this.setState({
			coinFormData: { ...this.state.prevCoinData },
		});
	};

	handleResetAsset = () => {
		this.setState({
			coinFormData: _cloneDeep(default_coin_data),
		});
	};

	// handleAssetType = (e) => {
	//     if (e.target.value === 'create_asset') {
	//         this.setState({
	//             coinFormData: default_coin_data,
	//             assetType: 'create_asset'
	//             // coinFormData: this.props.isExchangeWizard
	//             //     ? {}
	//             //     : default_coin_data
	//         });
	//     } else {
	//         this.setState({
	//             coinFormData: this.state.selectedCoinData,
	//             assetType: 'existing_asset'
	//         });
	//     }
	// };

	handleTabs = (activeTab) => {
		this.setCurrentPageAssets(activeTab);
		this.setState({ activeTab });
	};

	handleNext = () => {
		const { id, type } = this.state.coinFormData || {};
		if (this.state.currentScreen === 'step1') {
			if (id) {
				/* if (this.props.isExchangeWizard) {
					this.setState({
						coinFormData: {
							...this.state.coinFormData,
							...this.state.selectedCoinData
						}
					}, () => {
						this.handleConfirmation();
					});
				} else { */
				this.handleScreenChange('final');
				this.setState({
					coinFormData: {
						...this.state.coinFormData,
						...this.state.selectedCoinData,
					},
				});
				// }
			} else {
				// if (this.props.isExchangeWizard) {
				//     this.handleScreenChange('coin-pro');
				// } else {
				this.handleScreenChange('step3');
				// }
			}
		} else if (this.state.currentScreen === 'step3') {
			if (type !== 'blockchain') {
				if (!this.props.isConfigureEdit && !this.props.isEdit) {
					this.setState({
						coinFormData: {
							type,
							..._cloneDeep(default_coin_data),
						},
					});
				}
				if (type === 'fiat') {
					this.handleScreenChange('step6');
				} else {
					this.handleScreenChange('step7');
				}
			} else {
				this.handleScreenChange('step4');
			}
		} else if (this.state.currentScreen === 'step4') {
			this.setState({ prevCoinData: this.state.coinFormData });
			// if (network === 'ethereum') {
			//     const filterData = this.props.coins.filter((data) => data.symbol === 'eth');
			//     if (filterData.length) {
			//         const tempData = filterData[0] || {};
			//         delete tempData.meta;
			//         delete tempData.id;
			//         delete tempData.type;
			//         delete tempData.network;
			//         delete tempData.standard;
			//         delete tempData.value;
			//         let coinFormData = {
			//             ...this.state.coinFormData,
			//             ...tempData,
			//         }
			//         this.setState({
			//             coinFormData
			//         });
			//     }
			//     this.handleScreenChange('step5');
			// } else {
			this.handleScreenChange('step7');
			// }
		} else if (this.state.currentScreen === 'step5') {
			// if (type !== 'fiat') {
			this.handleScreenChange('step7');
			// } else {
			//     this.handleScreenChange('step6');
			// }
		} else if (this.state.currentScreen === 'step6') {
			this.handleScreenChange('step7');
		} else if (this.state.currentScreen === 'step7') {
			this.handleScreenChange('step8');
		} else if (this.state.currentScreen === 'step8') {
			this.handleScreenChange('step9');
		} else if (this.state.currentScreen === 'step9') {
			this.handleScreenChange('final');
		} else if (this.state.currentScreen === 'coin-pro') {
			this.handleConfirmation();
		}
	};

	handlePresetConfirmation = (symbol) => {
		const currentCoin = _get(
			this.props.coins.filter((coin) => coin.symbol === symbol),
			'[0]',
			{}
		);
		if (currentCoin) {
			this.setState(
				{ coinFormData: { ...currentCoin }, savePresetAsset: true },
				() => {
					this.handleScreenChange('final');
				}
			);
		}
	};

	handleConfirmation = async () => {
		if (this.state.savePresetAsset) {
			await this.props.handleRefreshCoin(this.state.coinFormData);
			message.success('Asset added successfully');
			this.props.onClose();
			this.setState({
				coinFormData: _cloneDeep(default_coin_data),
				savePresetAsset: false,
			});
		} else {
			this.props.handleConfirmation(
				this.props.isEdit || this.props.isConfigureEdit
					? this.props.formData
					: this.state.coinFormData,
				this.props.isEdit || this.props.isConfigureEdit,
				false,
				!!this.state.coinFormData.id
			);
			this.props.onClose();
			this.setState({ savePresetAsset: false });
		}
	};

	renderContent = (currentScreen) => {
		const {
			coins = [],
			selectedCoinData = {},
			coinFormData = {},
			// assetType = '',
			activeTab,
		} = this.state;

		switch (currentScreen) {
			case 'step2':
				return (
					<Step2
						coins={coins}
						exchangeCoins={this.props.exchangeCoins}
						// exchangeCoins={exchangeCoins}
						handleSearch={this.handleSearch}
						handleSelectCoin={this.handleSelectCoin}
						handleScreenChange={this.handleScreenChange}
						activeTab={activeTab}
						handleResetAsset={this.handleResetAsset}
					/>
				);
			case 'step3':
				return (
					<Step3
						isConfigureEdit={this.props.isConfigureEdit}
						isEdit={this.props.isEdit}
						coinFormData={coinFormData}
						handleScreenChange={this.handleScreenChange}
						handleNext={this.handleNext}
						handleChange={this.handleSelectChange}
						setCurrentPageAssets={this.setCurrentPageAssets}
						activeTab={activeTab}
						onClose={this.props.onClose}
					/>
				);
			case 'step4':
				return (
					<Step4
						coinFormData={coinFormData}
						handleSelectChange={this.handleSelectChange}
						handleScreenChange={this.handleScreenChange}
						handleNext={this.handleNext}
						handleChange={this.handleChange}
					/>
				);
			case 'step5':
				return (
					<Step5
						coinFormData={coinFormData}
						selectedCoinData={selectedCoinData}
						handleScreenChange={this.handleScreenChange}
						handleNext={this.handleNext}
						handleChange={this.handleSelectChange}
						handleRevertAsset={this.handleRevertAsset}
					/>
				);
			case 'step6':
				return (
					<Step6
						handleNext={this.handleNext}
						handleScreenChange={this.handleScreenChange}
					/>
				);
			case 'step7':
				return (
					<AssetConfig
						coins={this.props.coins}
						coinFormData={coinFormData}
						isConfigureEdit={this.props.isConfigureEdit}
						exchangeCoins={this.props.exchangeCoins}
						isEdit={this.props.isEdit}
						handleChange={this.handleChange}
						handleCheckChange={this.handleCheckChange}
						handleMetaChange={this.handleMetaChange}
						handleFileChange={this.handleFileChange}
						handleNext={this.handleNext}
						handleBack={this.handleBack}
						handleBulkUpdate={this.handleBulkUpdate}
						getCoins={this.props.getCoins}
						handleRefreshCoin={this.props.handleRefreshCoin}
						handlePresetConfirmation={this.handlePresetConfirmation}
					/>
				);
			case 'step8':
				return (
					<AssetPrice
						coinFormData={coinFormData}
						handleCheckChange={this.handleCheckChange}
						handleChangeNumber={this.handleChangeNumber}
						handleNext={this.handleNext}
						handleScreenChange={this.handleScreenChange}
						handleBulkUpdate={this.handleBulkUpdate}
					/>
				);
			case 'step9':
				return (
					<AssetParams
						coinFormData={coinFormData}
						handleCheckChange={this.handleCheckChange}
						handleChangeNumber={this.handleChangeNumber}
						handleNext={this.handleNext}
						handleScreenChange={this.handleScreenChange}
						handleBulkUpdate={this.handleBulkUpdate}
					/>
				);
			case 'final':
				return (
					<Final
						selectedCoinData={selectedCoinData}
						coinFormData={coinFormData}
						handleBack={this.handleBack}
						handleConfirmation={this.handleConfirmation}
						handleFileChange={this.handleFileChange}
					/>
				);
			case 'edit-color':
				return (
					<EditAsset
						type="color"
						coinFormData={coinFormData}
						handleChangeNumber={this.handleChangeNumber}
						handleMetaChange={this.handleMetaChange}
						onClose={this.props.onClose}
					/>
				);
			case 'burn':
				return (
					<BurnModal
						type="burn"
						coinFormData={coinFormData}
						exchange={this.props.exchangeData}
						handleChangeNumber={this.handleChangeNumber}
						onClose={this.props.onClose}
						handleBurn={this.handleBurn}
						exchangeUsers={this.props.exchangeUsers}
						userEmails={this.props.userEmails}
					/>
				);
			case 'mint':
				return (
					<BurnModal
						type="mint"
						coinFormData={coinFormData}
						exchange={this.props.exchangeData}
						handleChangeNumber={this.handleChangeNumber}
						onClose={this.props.onClose}
						handleMint={this.handleMint}
						exchangeUsers={this.props.exchangeUsers}
						userEmails={this.props.userEmails}
					/>
				);
			case 'edit-info':
				return (
					<EditAsset
						type="info"
						coinFormData={coinFormData}
						handleChange={this.handleChange}
						handleChangeNumber={this.handleChangeNumber}
						handleSelectChange={this.handleSelectChange}
						onClose={this.props.onClose}
					/>
				);
			case 'edit-params':
				return (
					<AssetPrice
						editParams={true}
						coinFormData={coinFormData}
						handleCheckChange={this.handleCheckChange}
						handleChangeNumber={this.handleChangeNumber}
						handleMetaChange={this.handleMetaChange}
						handleBulkUpdate={this.handleBulkUpdate}
						handleNext={this.handleScreenChange}
						handleScreenChange={this.props.onClose}
					/>
				);
			case 'edit-param-values':
				return (
					<AssetParams
						editParams={true}
						coinFormData={coinFormData}
						handleCheckChange={this.handleCheckChange}
						handleChangeNumber={this.handleChangeNumber}
						handleNext={this.props.onClose}
						handleScreenChange={this.handleScreenChange}
						handleBulkUpdate={this.handleBulkUpdate}
						handleMetaChange={this.handleMetaChange}
					/>
				);
			case 'coin-pro':
				return (
					<CoinLimited
						coinFormData={coinFormData}
						handleChange={this.handleChange}
						handleNext={this.handleNext}
					/>
				);
			case 'step1':
			default:
				return (
					<Step1
						// assetType={assetType}
						coins={coins}
						coinFormData={coinFormData}
						selectedCoinData={selectedCoinData}
						exchangeCoins={this.props.exchangeCoins}
						onClose={this.props.onClose}
						handleNext={this.handleNext}
						// handleChange={this.handleAssetType}
						handleScreenChange={this.handleScreenChange}
						handleTabs={this.handleTabs}
						activeTab={activeTab}
						handleResetAsset={this.handleResetAsset}
					/>
				);
		}
	};

	render() {
		return (
			<div className="create-asset-container">
				{this.renderContent(this.state.currentScreen)}
			</div>
		);
	}
}

const mapStateToProps = (state) => ({
	user: state.user,
	coins: state.asset.allCoins,
	exchange: state.asset.exchange,
});

CreateAsset.defaultProps = {
	handleWidth: () => {},
	isExchangeWizard: false,
	handleEditDataCallback: () => {},
	updateFormData: () => {},
	getCoins: () => {},
};

export default connect(mapStateToProps)(CreateAsset);
