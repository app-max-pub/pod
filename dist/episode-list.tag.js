console.log('episode-list', import.meta.url);
function NODE(name, attributes = {}, children = []) {
	let node = document.createElement(name);
	for (let key in attributes)
		node.setAttribute(key, attributes[key]);
	for (let child of children)
		node.appendChild(typeof child == 'string' ? document.createTextNode(child) : child);
	return node;
}
class XML {
	static parse(string, type = 'xml') {
		return new DOMParser().parseFromString(string.replace(/xmlns=".*?"/g, ''), 'text/' + type)
	}
	static stringify(DOM) {
		return new XMLSerializer().serializeToString(DOM).replace(/xmlns=".*?"/g, '')
	}
}
XMLDocument.prototype.stringify = XML.stringify
Element.prototype.stringify = XML.stringify
function XSLT(xsl) {
	let p = new XSLTProcessor();
	p.importStylesheet(typeof xsl == 'string' ? XML.parse(xsl) : xsl);
	return p;
}
XSLTProcessor.prototype.transform = function (xml) { return this.transformToFragment(typeof xml == 'string' ? XML.parse(xml) : xml, document) }
const XSL = XSLT(`<?xml version="1.0"?>
		<xsl:stylesheet version="1.0"  xmlns:xsl="http://www.w3.org/1999/XSL/Transform" >
		<xsl:template match='*'>
		<header>
			<img src='{//channel/image/url}' />
			<div>
				<h1>
					<xsl:value-of select='//channel/title' />
				</h1>
				<p>
					<xsl:value-of select='//channel/description' />
				</p>
				<b>
					<xsl:value-of select='count(//item)' /> episodes
				</b>
			</div>
		</header>
		<table class=''>
			<xsl:for-each select='//item'>
				<tr url='{*[starts-with(@url,"https:")]/@url}' on-tap='play'>
					<td class='meta'>
						<div class='v-strech'>
							<div class='date'>
								<time-format class='month' time='{pubDate}' format='MMM'></time-format>
								<time-format class='day' time='{pubDate}' format='DD'></time-format>
								<time-format class='year' time='{pubDate}' format='YYYY'></time-format>
							</div>
							<!-- <div class='month'>NOV</div>
						<div class='day'>29</div>
						<div class='year'>2020</div> -->
							<img class='heart' src='../icons/heart0.png' />
							<duration-format duration="{*[local-name()='duration']}">
								<xsl:value-of select="*[local-name()='duration']" />
							</duration-format>
						</div>
					</td>
					<td>
						<h3>
							<xsl:value-of select='title' />
						</h3>
						<p>
							<!-- <xsl:value-of select='description' /> -->
							<xsl:value-of select="*[local-name()='summary']" />
						</p>
					</td>
					<td>
						<!-- <img class='heart' src='../icons/heart0.png' /> -->
					</td>
				</tr>
			</xsl:for-each>
		</table>
	</xsl:template>
		</xsl:stylesheet>
		`);
let STYLE = document.createElement('style');
STYLE.appendChild(document.createTextNode(`@import url('https://max.pub/css/base.css');
	/* @import url('https://max.pub/css/publicSans.css'); */
	img {
		width: 100px;
	}
	p {
		font-size: 14px;
		text-align: justify;
		margin: .2em 0;
		padding: .2em 0;
		font-weight: 100;
	}
	header p {
		text-align: justify;
		margin: 1rem;
	}
	header {
		margin-bottom: 3rem;
		/* display: flex; */
	}
	header img {
		width: 300px;
		height: 300px;
	}
	.heart {
		width: 24px;
		filter: invert(100%);
		margin: 7px auto;
	}
	duration-format {
		font-size: 11px;
	}
	h1 {
		margin: 1rem;
		padding: 0;
	}
	h3 {
		margin: 0;
		padding: 0;
		font-size: 17px;
		font-weight: 300;
		text-align: justify;
	}
	/* tr{border: 5px solid red;} */
	/* .stripes tr:nth-child(2n) {
		background: var(--back-back);
	} */
	td {
		/* vertical-align: top; */
		padding: 1.8rem .4rem;
	}
	tr {
		/* stupid bug. only this fake height lets a div fill a table cell */
		/* https://stackoverflow.com/questions/3215553/make-a-div-fill-an-entire-table-cell */
		height: 1px; 
	}
	td {
		height: inherit;
	}
	tr:hover {
		background: var(--back-mark) !important;
		cursor: pointer;
	}
	.meta {
		/* height: 100%; */
	}
	.meta>div {
		display: flex;
		flex-direction: column;
		justify-content: space-around;
		height: 100%;
		flex: 1;
	}
	/* .date{text-align: center;} */
	.date>* {
		font-weight: 100;
		text-align: center;
		color: silver;
		display: block;
	}
	.year {
		font-size: 10px;
	}
	.month {
		font-size: 11px;
		text-transform: uppercase;
	}
	.day {
		font-size: 22px;
	}`));
function QQ(query, i) {
	let result = Array.from(this.querySelectorAll(query));
	return i ? result?.[i - 1] : result;
}
Element.prototype.Q = QQ
ShadowRoot.prototype.Q = QQ
DocumentFragment.prototype.Q = QQ
class WebTag extends HTMLElement {
	constructor() {
		super();
		this.attachShadow({ mode: 'open', delegatesFocus: true });
		this.shadowRoot.appendChild(STYLE.cloneNode(true)); //: CSS
		this.$HTM = document.createElement('htm')
		this.shadowRoot.appendChild(this.$HTM)
	}
	async connectedCallback() {
		this.$attachMutationObservers();
		this.$attachEventListeners();
		await this.$render() //: XSLT
		this.$onReady(); //: onReady
	}
	$attachMutationObservers() {
		this.modelObserver = new MutationObserver(events => {
			if ((events[0].type == 'attributes') && (events[0].target == this)) {
			} else {
				if (this.$autoUpdate !== false) this.$render(events); //: XSLT
			}
		}).observe(this, { attributes: true, characterData: true, attributeOldValue: true, childList: true, subtree: true });
	}
	$attachEventListeners() {
		let action = (event, key) => {
			try {
				let target = event.composedPath()[0];
				let action = target.closest(`[${key}]`);
				this[action.getAttribute(key)](action, event, target)
			}
			catch { }
		}
		this.addEventListener('click', e => action(e, 'on-tap')); //: onTap
	}
	$clear(R) {
		while (R.lastChild)
			R.removeChild(R.lastChild);
	}
	get $view() {
		return this.$HTM;
	}
	set $view(HTML) {
		this.$clear(this.$view);
		if (typeof HTML == 'string')
			HTML = new DOMParser().parseFromString(HTML, 'text/html').firstChild
		this.$view.appendChild(HTML);
	}
	get $data() {
		return this;
	}
	set $data(XML) {
		this.$clear(this.$data);
		if (typeof XML == 'string')
			XML = new DOMParser().parseFromString(XML, 'text/xml').firstChild
		this.appendChild(XML);
	}
	$render(events) {
		return new Promise((resolve, reject) => {
			window.requestAnimationFrame(t => {
				let xml = XML.parse(XML.stringify(this))  // some platforms need to reparse the xml
				let output = XSL.transform(xml);
				this.$view = output;
				resolve()
			});
		});
	}
	$event(name, options) {
		this.dispatchEvent(new CustomEvent(name, {
			bubbles: true,
			composed: true,
			cancelable: true,
			detail: options
		}));
	}
};
const list = {
		his2go: `https://his2go.podigee.io/feed/mp3`,
		bbc: `https://podcasts.files.bbci.co.uk/p02nq0gn.rss`, // bbc global news
		freu: `https://beste-freundinnen.podigee.io/feed/mp3`, // beste freundinnen
		handel: `https://handelsblatt-morningbriefing.podigee.io/feed/mp3`, // handelsblatt morning briefing
		eco: `https://www.economist.com/media/rss/economist.xml`, // economist
		nyt: `https://rss.art19.com/the-daily`,// nyt the daily
	}
	import 'https://v.max.pub/@tag-max-pub/time/2021/dist/time-format.tag.js'
	import './duration-format.tag.js';
	class episode_list extends WebTag {
		async $onReady() {
			let podcast = document.location.hash.slice(1) || 'bbc';
			console.log('load', podcast)
			let data = await fetch(list[podcast]).then(x => x.text())
			console.log('data', data)
			this.$data = data
		}
		play(node) {
			let url = node.getAttribute('url')
			this.$event('play', { url })
		}
	}
window.customElements.define('episode-list', episode_list)