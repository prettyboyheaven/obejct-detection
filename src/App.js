import React, { Component } from 'react';
import Konva from 'konva';
import './App.css';

class App extends Component {
  state = {
    isDrawing: false,
    startDrawingPositionX: null,
    startDrawingPositionY: null
  };

  stage;
  layer;
  rect;
  group;

  componentDidMount() {
    this.stage = new Konva.Stage({
      container: 'container',
      width: window.innerWidth,
      height: window.innerHeight
    });

    this.layer = new Konva.Layer();

    this.stage.on('mousedown', (e) => {
      console.log(e.target);

      if(e.target.attrs.name === 'rect') {
        return
      }

      this.setState({
        isDrawing: true,
        startDrawingPositionX: e.evt.pageX,
        startDrawingPositionY: e.evt.pageY,
      });

      this.group = new Konva.Group({
        x: e.evt.pageX,
        y: e.evt.pageY,
        draggable: true
      });

      this.rect = new Konva.Rect({
        x: e.evt.pageX,
        y: e.evt.pageY,
        width: 0,
        height: 0,
        fill: 'rgba(0, 0, 0, 0.3)',
        stroke: 'black',
        position: 'relative',
        overflow: 'hidden',
        cursor: 'pointer',
        strokeWidth: 2,
        name: 'rect'
      });

      this.group.add(this.rect);
      this.layer.add(this.group);
      this.group.draw();
    });

    this.stage.on('mousemove', (e) => {
      e.cancelBubble = true;

      if(!this.state.isDrawing) {
        return
      }

      this.rect.attrs.width = e.evt.pageX - this.state.startDrawingPositionX;
      this.rect.attrs.height = e.evt.pageY - this.state.startDrawingPositionY;

      this.layer.draw();
    });
    this.stage.on('mouseup', () => {
      this.setState({
        isDrawing: false,
        startDrawingPositionX: null,
        startDrawingPositionY: null,
      })
    });

    this.stage.add(this.layer);
  }

  render() {
    return (
        <div id='container' />
    );
  }
}

export default App;
