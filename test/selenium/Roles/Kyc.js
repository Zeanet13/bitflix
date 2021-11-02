// KYC
async function Kyc(){
	const { Builder, By, Key, until } = require('selenium-webdriver');
	const assert = require('assert');
	const path = require('path');
	const logPath = path.join(__dirname, './.log',path.basename(__filename,'.js'));
	const reportPath = path.join(__dirname, './../Report',path.dirname(__filename).replace(path.dirname(__dirname),''),path.basename(__filename,'.js'));
	const util = require ('../Utils/Utils.js');
	const { addConsoleHandler } = require('selenium-webdriver/lib/logging');
	util.makeReportDir(reportPath);
	util.makeReportDir(logPath);
	require('console-stamp')(console, { 
		format: ':date(yyyy/mm/dd HH:MM:ss.l)|' 
	} );
	require('dotenv').config({ path: path.resolve(__dirname, './../.env') });
	let KYC = process.env.KYC;
	let password = process.env.PASSWORD;
	let logInPage = process.env.LOGIN_PAGE;
	let step = util.getStep();
	util.logHolla(logPath)

	describe('KYC', function() {
		this.timeout(3000000);
		let driver;
		let vars;
		function sleep(ms) {
			return new Promise((resolve) => {
				setTimeout(resolve, ms);
			});
		}
		beforeEach(async function() {
			driver = await new Builder().forBrowser('chrome').build();
			driver.manage().window().maximize();
			vars = {};
		});
		afterEach(async function() {
			await driver.quit();
		});
		it('KYC', async function() {
			console.log(' KYC role can access some user data to review KYC requirements');
			console.log(' Test name: KYC');
			console.log(' Step # | name | target | value');
		
			console.log(step++,'  | open | /login | ');
			await driver.get(logInPage);
			await sleep(5000);
		
			console.log(step++,'  | type | name=email |'+KYC);
			await driver.findElement(By.name('email')).sendKeys(KYC);
		
			console.log(step++,'  | type | name=password | Password');
			await driver.findElement(By.name('password')).sendKeys(password);
		
			console.log(step++,'  | click | css=.holla-button | ');
			await driver.findElement(By.css('.holla-button')).click();
			await sleep(5000);
		
			console.log(step++,'  | click | css=a > .pl-1 | ');
			await driver.findElement(By.css('a > .pl-1')).click();
			await sleep(5000);
		
			console.log(step++,'  | click | css=.role-section > div:nth-child(2) | ');
			await driver.findElement(By.css('.role-section > div:nth-child(2)')).click();
		
			console.log(step++,'  | assertText | css=.sub-label | KYC');
			assert(await driver.findElement(By.css('.sub-label')).getText() == 'KYC');

			console.log(step++,'  | click | css=.active-side-menu | ');
			await sleep(5000);
			// await driver.findElement(By.css(".active-side-menu")).click()
			await driver.findElement(By.linkText('Users')).click();
		
			console.log(step++,'  | click | name=id | ');
			await driver.findElement(By.name('id')).click();
		
			console.log(step++,'  | type | name=id | 1');
			await driver.findElement(By.name('id')).sendKeys('1');
		
			console.log(step++,'  | sendKeys | name=id | ${KEY_ENTER}');
			await driver.findElement(By.name('id')).sendKeys(Key.ENTER);
		
			console.log(' 12 | click | css=.ant-btn | ');
			await driver.findElement(By.css('.ant-btn')).click();
		
			console.log(step++,'  | click | id=rc-tabs-8-tab-bank | ');
			await sleep(5000);
			await driver.findElement(By.id('rc-tabs-1-tab-bank')).click();
		
			console.log(step++,'  | click | css=.ant-col:nth-child(1) .ant-card-head-wrapper | ');
			await driver.findElement(By.css('.ant-col:nth-child(1) .ant-card-head-wrapper')).click();
		
			console.log(step++,'  | assertElementPresent | css=.ant-col:nth-child(1) .ant-card-head-title |  |'); 
			{
				const elements = await driver.findElements(By.css('.ant-col:nth-child(1) .ant-card-head-title'));
				assert(elements.length);
			}

			console.log(step++,'  | click|linkText = Financials | ');
			await driver.findElement(By.linkText('Financials')).click();
			await sleep(5000);

			console.log(step++,'  | runScript | window.scrollTo(0,0) | ');
			await driver.executeScript('window.scrollTo(0,0)');
		
			console.log(step++,'  | click | css=p | ');
			await sleep(5000);
			await driver.findElement(By.css('p')).click();
		
			console.log(step++,'  | assertElementPresent | css=p | ');
			{
				const elements = await driver.findElements(By.css('p'));
				assert(elements.length);
			}
		
			console.log(step++,'  | click | css=.ant-card-body > .ant-alert | ');
			await driver.findElement(By.css('.ant-card-body > .ant-alert')).click();
		
			console.log(step++,'  | assertElementPresent | css=.ant-card-body .ant-alert-description | ');
			{
				const elements = await driver.findElements(By.css('.ant-card-body .ant-alert-description'));
				assert(elements.length);
			}
		
			console.log(step++,'  | click | id=rc-tabs-2-tab-1 | ');
			await driver.findElement(By.id('rc-tabs-2-tab-1')).click();
			await sleep(5000);
		
			console.log(step++,' | click | xpath=//*[@id="rc-tabs-2-panel-1"]/div/div[1]/button | ');
			await driver.findElement(By.xpath('//*[@id="rc-tabs-2-panel-1"]/div/div[1]/button')).click();
			await sleep(5000);
			
			console.log(step++,'  | assertText | css=.sub-title | Asset:');
			assert(await driver.findElement(By.css('.sub-title')).getText() == 'Asset:')
			
			console.log(step++,'  | click | css=.btn-wrapper > .ant-btn:nth-child(1) |');
			await driver.findElement(By.css('.btn-wrapper > .ant-btn:nth-child(1)')).click();
			await sleep(3000);
				
			console.log(step++,' | click | id =rc-tabs-2-tab-2 | ');
			await driver.findElement(By.id('rc-tabs-2-tab-2')).click();
			await sleep(5000);
		
			console.log(step++,'  | assertText | css=.ant-alert-closable > .ant-alert-message | Access denied: User is not authorized to access this endpoint');
			assert(await driver.findElement(By.css('.ant-alert-closable > .ant-alert-message')).getText() == 'Access denied: User is not authorized to access this endpoint');
		
			console.log(step++,'  | click | id=rc-tabs-2-tab-3 | ');
			await driver.findElement(By.id('rc-tabs-2-tab-3')).click();
			await sleep(4000);

			console.log('should be fixed');
			console.log(step++,'  | assertText | css=#rc-tabs-2-panel-withdrawals .app-wrapper > .ant-alert > .ant-alert-message | Access denied: User is not authorized to access this endpoint');
			console.log(await driver.findElement(By.xpath('//*[@id="rc-tabs-2-panel-3"]/div/div/div/div[2]')).getText());
			assert(await driver.findElement(By.xpath('//*[@id="rc-tabs-2-panel-3"]/div/div/div/div[2]')).getText() == 'Access denied: User is not authorized to access this endpoint');
		
			console.log('This is the EndOfTest');
		});
	});
}
describe('Main Test', function () {
 
	Kyc();
})
module.exports.Kyc = Kyc;