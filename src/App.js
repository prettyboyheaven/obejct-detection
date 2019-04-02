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
    ratio: null
  };

  stage;
  layer;
  rect;
  group;

  componentDidMount() {
    this.stage = new Konva.Stage({
      container: 'container',
      width: 700,
      height: 450,
    });

    this.layer = new Konva.Layer();

    const imageObj = new Image();
    imageObj.onload = (e) => {

      const imageNaturalHeight = e.target.naturalHeight;
      const imageNaturalWidth = e.target.naturalWidth;

      const imageSize = this.calculateAspectRatioFit(imageNaturalWidth, imageNaturalHeight, 700, 450);
      console.log(imageSize);

      const imageToDetect = new Konva.Image({
        x: 0,
        y: 0,
        image: imageObj,
        width: imageSize.width,
        height: imageSize.height,
      });

      //imageToDetect.rotate(90)

      // add the shape to the layer
      this.layer.add(imageToDetect);
      // add the layer to the stage
      this.layer.draw();
    };
    imageObj.src = 'https://pp.userapi.com/c847221/v847221287/15c995/iKuT4gxoNPk.jpg';

    this.stage.on('mousedown', (e) => {
      console.log(e.evt);

      if(e.target.attrs.name === 'rect') {
        return
      }

      this.setState({
        isDrawing: true,
        startDrawingPositionX: e.evt.layerX,
        startDrawingPositionY: e.evt.layerY,
      });

      this.group = new Konva.Group({
        x: e.evt.layerX,
        y: e.evt.layerY,
        draggable: true,
        id: updateCount(count)
      });

      this.rect = new Konva.Rect({
        x: e.evt.pageX,
        y: e.evt.pageY,
        width: 0,
        height: 0,
        fill: 'rgba(255, 255, 255, 0.7)',
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

      this.rect.attrs.width = e.evt.layerX - this.state.startDrawingPositionX;
      this.rect.attrs.height = e.evt.layerY - this.state.startDrawingPositionY;

      this.layer.draw();
    });

    this.stage.on('mouseup', () => {

      const { attrs } = this.rect;

      if (Math.abs(attrs.height) < 20 || Math.abs(attrs.width) < 20 ) {
        this.setState({
          groups: this.state.groups.filter(groupItem => groupItem._id !== this.group._id)
        });

        this.group.remove();
        this.layer.draw()
      }

      const crossImage = new Image();

      crossImage.onload = () => {

        const imageToDetect = new Konva.Image({
          x: this.group.attrs.x,
          y: 0,
          image: imageObj,
          width: 30,
          height: 30,
          position: 'absolute'
        });

        //imageToDetect.rotate(90)

        // add the shape to the layer
        this.group.add(imageToDetect);
        // add the layer to the stage
        this.layer.draw();
      };

      crossImage.src = 'https://upload.wikimedia.org/wikipedia/ru/4/49/%D0%9F%D0%BE%D0%BA%D0%B5%D0%BC%D0%BE%D0%BD_%D0%98%D0%B2%D0%B8.png'

      this.setState({
        isDrawing: false,
        startDrawingPositionX: null,
        startDrawingPositionY: null,
      })
    });

    this.stage.add(this.layer);
  }

  handleGetData = () => {
    const { ratio } = this.state;

    const { x, y, width, height } = this.state.groups[0].getClientRect();

    const coordsWithRatio = {
      x: Math.round(x / ratio),
      y: Math.round(y / ratio),
      width: Math.round(width / ratio),
      height: Math.round(height / ratio)
    };

    console.log(coordsWithRatio);
  };

  calculateAspectRatioFit = (srcWidth, srcHeight, maxWidth, maxHeight) => {

    this.setState({
      ratio: Math.min(maxWidth / srcWidth, maxHeight / srcHeight)
    });

    const { ratio } = this.state;

    return {
      width: srcWidth * ratio,
      height: srcHeight * ratio,
    };
  };


  render() {
    return (
        [<div key='1' id='container' style={ { border: '5px solid black', width: '700px', height: '450px', margin: '25px 0' } } />, <button onClick={ this.handleGetData } key='2'>get rects</button>]

    );
  }
}

export default App;
