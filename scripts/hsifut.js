const URL_INVESTING_COM = 'https://www.investing.com/indices/hong-kong-40-futures'
const URL_DW28 = 'https://www.thaidw.com/LiveIndexJSON?ric=HSI'
const URL_HKEX = 'https://www.hkex.com.hk/Market-Data/Futures-and-Options-Prices/Equity-Index/Hang-Seng-Index-Futures-and-Options?sc_lang=en#&product=HSI'
const URL_HKEX_JSON = 'https://www1.hkex.com.hk/hkexwidget/data/getderivativesfutures?lang=eng&ats=HSI&type=0&qid=1692728093333&callback=j&_=1692728091419&token='

/*
Original:
		LabCI.getToken = function () {
			// ----- THIS IS A SAMPLE IMPLEMENTATION -----
			//return "Base64-AES-Encrypted-Token";
			return "evLtsLsBNAUVTPxtGqVeG83Wg3tETDJQQjQD%2fuGA91hJ9VRY3dySqSWYZoltXyjj";
		};
*/
const DEFAULT_HKEX_TOKEN = "evLtsLsBNAUVTPxtGqVeG3k5qeB0oxuZvG81H0ZLK2dYk6E9bAPP2qsYni9vyrEz"

/**
 * Returns list of references.
 * 
 * @returns list of references.
 */
export function getRefs () {
	return [
		URL_INVESTING_COM,
		URL_DW28,
		URL_HKEX,
		URL_HKEX_JSON
	]
}

/**
 * Returns month of HSI future in investing.com stream.
 * 
 * @returns Month of HSI future in investing.com stream.
 */
async function getHSIFutSeriesMonthFromInvesting () {
	var res = await fetch(
		URL_INVESTING_COM,
		{
			method: 'GET',
		}
	)
	if (res.ok) {
		res = await res.text()
		
		// console.log("getHSIFutSeriesMonthFromInvesting(): res: " + res)
		// find month_date
		for (var series of res.matchAll(/month_date[^>]+>\s*([A-Za-z]+)\s+\d+\s*</ig)) {
			console.log("getHSIFutSeriesMonthFromInvesting(): res part: " + JSON.stringify(series))
			return series[1]
		}
	} 
}

/**
 * Returns month of HSI future as DW28 underlying.
 * 
 * @returns Month of HSI future as underlying for DW28.
 */
async function getHSIFutSeriesMonthFromDW28 () {
	var res = await fetch(URL_DW28)
	if (res.ok) {
		res = await res.json()
		console.log("getHSIFutSeriesMonthFromDW28(): " + JSON.stringify(res))
		return res.month
	} 
}

/**
 * Returns available token to access data from www.hkex.com.hk, such as current prices of HSI futures in json.
 * 
 * @returns Token to access data in www.hkex.com.hk
 */
async function getHKEXWebToken () {
	var token = await fetch(URL_HKEX)
	if (!token.ok) {
		console.log("getHKEXWebToken(): Failed to connect to hkex.com.hk page: " + JSON.stringify(token))
		return
	}
	token = await token.text()
	// console.log("getHKEXWebToken(): hkex.com.hk page: " + token)
	console.log("getHKEXWebToken(): hkex.com.hk page found 'LabCI.getToken': " + token.indexOf("LabCI.getToken"))
	for (token of token.matchAll(/labci.gettoken\s*=\s*(.+?)}/igs)) {
		// console.log("getHKEXWebToken(): regex match=" + JSON.stringify(token[1]))
		token = token[1].replace(/\/\/.+/g, '')
		// console.log("getHKEXWebToken(): regex match no comment=" + token)
		token = token.matchAll(/return\s+["'](.+?)["']/gs)
		token = token.next()
		try {
			console.log("getHKEXWebToken(): matched token=" + JSON.stringify(token))
			return token.value[1]
		} catch {
			console.log("getHKEXWebToken(): failed to parse token." )
		}
	}
}

/**
 * Returns object of series name to lastest price of HSI futures.
 * 
 * The given token is provided in website, such as:
 *	https://www.hkex.com.hk/Market-Data/Futures-and-Options-Prices/Equity-Index/Hang-Seng-Index-Futures-and-Options?sc_lang=en#&product=HSI
 *
 * @see getHKEXWebToken()
 * 
 * @param {string} token to access data in hsiex.com.hk website
 * @returns object of series name to lastest price of HSI futures.
 */
async function getHSIFutSeriesPrices (token) {
	if (!token) {
		token = DEFAULT_HKEX_TOKEN
		console.log("getHSIFutSeriesPrices(): No token. Set to default: [" + token + "]")
	}
	var res = await fetch(
		URL_HKEX_JSON + token
	)
	
	if (res.ok) {
		res = await res.text()
		console.log("getHSIFutSeriesPrices(): res=" + res)

		const l = res.indexOf('(')
		const r = res.lastIndexOf(')')
		if (l >= 0 && l < r) {
			res = res.substring(l + 1, r)
			res = JSON.parse(res)
			console.log("getHSIFutSeriesPrices(): extracted: " + JSON.stringify(res, null, 4))
			try {
				res = res.data.futureslist
					.reduce((d, s) => {
						const m = s.con.substring(0, 3).toUpperCase()
						if (!d[m]) {
							d[m] = s.ls
						}
						return d
					}, {})
					
				return res
			} catch {
				console.log("getHSIFutSeriesPrices(): Failed to find data from parsed json")
				return null
			}
		}
	}
}

/**
 * Returns true if HSI future series in investing.com and in dw28 are similar.
 * 
 * @returns True if HSI future series in investing.com and in dw28 are similar.
 */
export async function checkDW28HSISeries() {
	const dw28SeriesMonth = await getHSIFutSeriesMonthFromDW28()
	const investingSeriesMonth = await getHSIFutSeriesMonthFromInvesting()
	return (dw28SeriesMonth.substring(0, 3) !== investingSeriesMonth.substring(0, 3))
}

/**
 * Returns the HSI future in investing.com and underlying in DW28.
 * 
 * For example, return object:
 * 
 * {
 * 	'DW28': {
 * 		'print': '12,345',
 * 		'dt': 'Sun Aug 27 2023 17:21:22 GMT+0700 (Indochina Time)',
 * 		'link': 'http...',
 * 	},
 * 	'Investing.com': {
 * 		'print': '12,345',
 * 		'dt': 'Sun Aug 27 2023 17:21:24 GMT+0700 (Indochina Time)',
 * 		'link': 'http...',
 * 	}
 * }
 * 
 * @returns comparison result in object type.
 */
export async function getHSIFutSeries() {
	const dw28SeriesMonth = await getHSIFutSeriesMonthFromDW28()
	const investingSeriesMonth = await getHSIFutSeriesMonthFromInvesting()

	const token = await getHKEXWebToken()
	const series = await getHSIFutSeriesPrices(token)
	
	console.log("checkDW28HSISeries(): HSI series=" + JSON.stringify(series, null, 4))
		
	const dw28Price = series[dw28SeriesMonth.substring(0, 3).toUpperCase()]
	const dw28DT = new Date()
	const investingPrice = series[investingSeriesMonth.substring(0, 3).toUpperCase()]
	const investingDT = new Date()
	return {
		'DW28': {
			'price': dw28Price,
			'dt': dw28DT,
			'link': URL_DW28
		},
		'Investing.com': {
			'price': investingPrice,
			'dt': investingDT,
			'link': URL_INVESTING_COM,
		}
	}

}