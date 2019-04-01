import React, { Component } from 'react';
import Konva from 'konva';
import './App.css';

let count = 0;
const updateCount = (count) => count + 1;

class App extends Component {
  state = {
    isDrawing: false,
    startDrawingPositionX: null,
    startDrawingPositionY: null,
    groups: [],
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

    const imageObj = new Image();
    imageObj.onload = (e) => {

      const imageNaturalHeight = e.target.naturalHeight;
      const imageNaturalWidth = e.target.naturalWidth;

      const imageToDetect = new Konva.Image({
        x: 0,
        y: 0,
        image: imageObj,
        width: imageNaturalWidth,
        height: imageNaturalHeight
      });

      // add the shape to the layer
      this.layer.add(imageToDetect);

      // add the layer to the stage
      this.layer.draw();
    };
    imageObj.src = 'https://pp.userapi.com/c840326/v840326095/49957/hNhQKMcMU0o.jpg';

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
        draggable: true,
        id: updateCount(count)
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

      this.setState({
        groups: [...this.state.groups, this.group]
      });

      this.state.groups.forEach(item => item.on('click', () => {
        this.setState({
          groups: this.state.groups.filter(groupItem => groupItem._id !== item._id)
        });

        item.remove();
        this.layer.draw()
      }));

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
        <div id='container' style={ { border: '5px solid black' } } />
    );
  }
}

export default App;
