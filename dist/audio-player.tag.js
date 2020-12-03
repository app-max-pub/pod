console.log('audio-player', import.meta.url);
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
const HTML = document.createElement('template');
HTML.innerHTML = `<input type="range" min="0" max="100" value="0" class="slider" id="myRange">
	<div id='controls'>
		<div>
			<img src='../icons/volume_down.png' on-tap='volume' volume='-0.1' />
			<span id='volume'>100%</span>
			<img src='../icons/volume_up.png' on-tap='volume' volume='+0.1' />
		</div>
		<div>
			<img src='../icons/backward.png' on-tap='backward' />
			<span id='played' class=''></span>
			<!-- <button on-tap='play_pause'></button> -->
			<img id='play_pause' src='../icons/play.png' on-tap='play_pause' />
			<span id='total' class=''></span>
			<img src='../icons/forward.png' on-tap='forward' />
		</div>
		<div>
			<img src='../icons/slower.png' on-tap='speed' speed='-0.1' />
			<span id='speed'>100%</span>
			<img src='../icons/faster.png' on-tap='speed' speed='+0.1' />
		</div>
	</div>
	<div id='player'>
		<audio controls="controls">
			<!-- <source src="horse.ogg" type="audio/ogg"> -->
			<!-- <source src="https://open.live.bbc.co.uk/mediaselector/6/redir/version/2.0/mediaset/audio-nondrm-download-low/proto/https/vpid/p0902c0s.mp3" type="audio/mpeg"/> -->
			<source src="" type="audio/mpeg" />
			Your browser does not support the audio element.
		</audio>
	</div>`;
let STYLE = document.createElement('style');
STYLE.appendChild(document.createTextNode(`@import url('https://max.pub/css/fira.css');
	:host {
		display: block;
		background: #000;
		height: 50px;
		--front-mark: #aaf;
		--back-back: #333;
		--size: 25px;
	}
	audio {
		display: none;
	}
	#controls {
		font-size: 12px;
		display: flex;
		justify-content: space-around;
	}
	#controls span{
		font-size: 15px;
		line-height: 32px;
		vertical-align: top;
		display: inline-block
	}
	#controls img {
		width: 32px;
		filter: invert(100%);
		display: inline-block;
	}
	/* The slider itself */
	.slider {
		-webkit-appearance: none;
		/* Override default CSS styles */
		appearance: none;
		width: 100%;
		/* Full-width */
		height: 7px;
		/* Specified height */
		background: var(--back-back);
		/* Grey background */
		outline: none;
		border-radius: 10px;
		/* Remove outline */
		/* opacity: 0.7; */
		/* Set transparency (for mouse-over effects on hover) */
		/* -webkit-transition: .2s; */
		/* 0.2 seconds transition on hover */
		/* transition: opacity .2s; */
	}
	/* Mouse-over effects */
	.slider:hover {
		opacity: 1;
		/* Fully shown on mouse-over */
	}
	/* The slider handle (use -webkit- (Chrome, Opera, Safari, Edge) and -moz- (Firefox) to override default look) */
	.slider::-webkit-slider-thumb {
		-webkit-appearance: none;
		/* Override default look */
		appearance: none;
		width: var(--size);
		/* Set a specific slider handle width */
		height: var(--size);
		/* Slider handle height */
		background: var(--front-mark);
		/* Green background */
		cursor: pointer;
		/* Cursor on hover */
		border-radius: var(--size);
	}
	.slider::-moz-range-thumb {
		width: var(--size);
		/* Set a specific slider handle width */
		height: var(--size);
		/* Slider handle height */
		background: var(--front-mark);
		/* Green background */
		cursor: pointer;
		/* Cursor on hover */
		border-radius: var(--size);
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
		this.$applyHTML(); //: HTML
		this.$attachMutationObservers();
		this.$attachEventListeners();
		this.$onReady(); //: onReady
	}
	$attachMutationObservers() {
		this.modelObserver = new MutationObserver(events => {
			if ((events[0].type == 'attributes') && (events[0].target == this)) {
			} else {
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
	$applyHTML() {
		this.$view = HTML.content.cloneNode(true)
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
	$event(name, options) {
		this.dispatchEvent(new CustomEvent(name, {
			bubbles: true,
			composed: true,
			cancelable: true,
			detail: options
		}));
	}
};
function humanTime(sec) {
		return String(Math.floor(sec / 60)).padStart(2, '0') + ':' + String(Math.floor(sec % 60)).padStart(2, '0')
	}
	class audio_player extends WebTag {
		async $onReady() {
			this.player = this.$view.Q('audio', 1);
			this.slider = this.$view.Q('.slider', 1);
			this.slider.addEventListener('input', e => this.changePosition())
			window.addEventListener('play', e => this.play(e.detail.url));
			setInterval(() => this.update(), 500);
		}
		play(url) {
			console.log('audio-play', url)
			this.player.innerHTML = `<source src="${url}" type="audio/mpeg" />`;
			this.player.load()
			this.player.play();
		}
		update() {
			this.slider.setAttribute('max', this.player.duration)
			this.slider.value = this.player.currentTime
			this.$view.Q('#played', 1).textContent = humanTime(this.player.currentTime)
			this.$view.Q('#total', 1).textContent = humanTime(this.player.duration || 0)
			this.$view.Q('#play_pause', 1).setAttribute('src', '../icons/' + (this.player.paused ? 'play.png' : 'pause.png'))
			this.$view.Q('#speed', 1).textContent = Math.round(this.player.playbackRate * 100) + '%'
			this.$view.Q('#volume', 1).textContent = Math.round(this.player.volume * 100) + '%'
		}
		changePosition() {
			console.log('pos', this.slider.value)
			this.player.currentTime = this.slider.value;
			this.update()
		}
		play_pause(node) {
			if (this.player.paused) this.player.play()
			else this.player.pause()
			this.update()
		}
		forward() {
			this.player.currentTime += 30;
			this.update()
		}
		backward() {
			this.player.currentTime -= 15;
			this.update()
		}
		speed(node) {
			this.player.playbackRate += node.getAttribute('speed') * 1;
			this.update()
		}
		volume(node) {
			this.player.volume += node.getAttribute('volume') * 1;
			this.update()
		}
	}
window.customElements.define('audio-player', audio_player)