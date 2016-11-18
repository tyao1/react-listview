import React, { Component } from 'react';
// import logo from './logo.svg';
import './ListView.scss';

const randomItems = [1,1,1,1,1,1,1,11,1,11,1,1,1,1,1,1,1,1,].map(() => {
  return {
    height: Math.random() * 1000,
  }
});

const throttle = (fn, threshhold = 250, scope) => {
	let last;
	let deferTimer;
	return function throttled() {
		const context = scope || this;
		const now = Date.now();
		const args = arguments;
		if (last && now < last + threshhold) {
			// hold on to it
			clearTimeout(deferTimer);
			deferTimer = setTimeout(function deferred() {
				last = now;
				fn.apply(context, args);
			}, threshhold);
		} else {
			last = now;
			fn.apply(context, args);
		}
	};
}

class ListView extends Component {
  static defaultProps = {
    items: randomItems,
    renderItem: (props, index) => {
      return (<div
          key={index}
          style={{
            height: props.height,
            border: '1px solid grey',
          }}
        >
      </div>);
    },
    renderHeader: () => {
      return (<div>this is header</div>);
    },
    renderFooter: () => {
      return (<div>this is footer</div>);
    },

    assumedHeight: 200,
    size: 8,
  }

  state = {
    paddingTop: 0,
    paddingBottom: 0,
    sliceStart: 0,
    sliceEnd: 0,
  }

  componentWillMount() {
    const { assumedHeight, items, size } = this.props;
    const paddingBottom = Math.max(0, items.length - size) * assumedHeight;
    this.setState({
      paddingBottom,
      sliceEnd: size,
    })
  }

  componentDidMount() {
    window.addEventListener('scroll', this.onThrottledScroll);
  }

  componentWillUnmount() {
    window.removeEventListener('scroll', this.onThrottledScroll);
  }

  onThrottledScroll = throttle(() => {
    if (!this.elem) return;
    console.log('trigger');

    const scrollY = window.scrollY;
    if ( this.lastY < scrollY ) {
      console.log('trigger2');

      if (this.state.sliceEnd >= this.props.items.length) {
        this.lastY = scrollY;
        return;
      }

      // scroll down
      const { top, height } = this.elem.getBoundingClientRect();
      if (top + height < -4 * this.props.assumedHeight) {
        // [TODO] not full height?
        // top elem scrolled up of the view,
        // let's slice the shit
        const { sliceStart, paddingTop, sliceEnd } = this.state;
        const { assumedHeight, items } = this.props;

        const newSliceEnd = Math.min(sliceEnd + 1, items.length);
        const newSliceStart = sliceStart + 1;
        console.log('[DOWN]', sliceStart + 1,newSliceEnd, items.length);
        this.setState({
          sliceStart: newSliceStart,
          sliceEnd: newSliceEnd,
          paddingBottom: (items.length - newSliceEnd)  * assumedHeight,
          paddingTop: paddingTop + height,
        });

        this.heightCache[sliceStart] = height;
      }
    } else if (this.lastY > scrollY) {
      if (this.state.sliceStart === 0) {
        this.lastY = scrollY;
        return;
      }
      // scroll up
      const { top, height } = this.elem.getBoundingClientRect();
      if ( top > -4 * this.props.assumedHeight && top <= screen.height) { // [TODO] scrollview height
        // about to go to last elem
        const { sliceStart, paddingTop, sliceEnd } = this.state;
        const { assumedHeight, items } = this.props;

        const newSliceStart = sliceStart - 1;
        const newSliceEnd = sliceEnd - 1;
        console.log(
          '[UP]',
          this.elem,
          top, height,
          newSliceStart,
          newSliceEnd,
          items.length,
        );
        this.elem = null; // avoid triggering multiple times
        this.setState({
          sliceStart: newSliceStart,
          paddingTop: paddingTop - this.heightCache[newSliceStart],
          sliceEnd: newSliceEnd,
          paddingBottom: (items.length - newSliceEnd)  * assumedHeight,
        });
        /*
        const { top: topBottom, bottom, height: heghtBottom }  = this.elemBottom.getBoundingClientRect();
        console.log(bottom, screen.height);
        if (topBottom >= screen.height) {
          this.setState({
            sliceEnd: newSliceEnd,
            paddingBottom: (items.length - newSliceEnd)  * assumedHeight,
          });
        }
        */
      }
    }
    this.lastY = scrollY;
  }, 100, this)

  heightCache = {

  }
  lastY = 0
  _setTopElem = (ref) => {
    this.elem = ref;
  }
  _setBottomElem = ref => {
    this.elemBottom = ref;
  }
  _renderItems = () => {
    const { items, renderItem } = this.props;

    if (items.length < 1) return;
    const { sliceStart, sliceEnd} = this.state;
    const ret = [];
    // first elem;
    ret.push(
      <div
        key={sliceStart}
        ref={this._setTopElem}
      >
        {renderItem(items[sliceStart], sliceStart)}
      </div>
    )
    if ((sliceStart + 1) < items.length) {
      for (let i = sliceStart + 1; i < sliceEnd; i++) {
        ret.push(
          <div key={i}>{renderItem(items[i], i)}</div>
        )
      }
    }

    /*
    //  [TODO] LENGTH < 3 ??
    ret.push(
      <div
        key={sliceEnd - 1}
        ref={this._setBottomElem}
      >
        {renderItem(items[sliceEnd - 1], sliceEnd - 1)}
      </div>
    );
    */
    return ret;
  }



  render() {
    const { items, renderItem, renderHeader, renderFooter } = this.props;
    const { paddingTop, paddingBottom } = this.state;
    return (
      <div style={{
        paddingTop,
        paddingBottom,
      }}>
        {renderHeader()}
        {
          this._renderItems()
        }
        {renderFooter()}
      </div>
    );
  }
}

export default ListView;
