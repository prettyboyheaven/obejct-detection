import React, { Component } from 'react';
import Konva from 'konva';
import './App.css';

let count = 0;
const updateCount = (count) => count + 1;

class App extends Component {
  state = {
    canvasHeight: 450,
    canvasWidth: 700,
    isDrawing: false,
    startDrawingPositionX: null,
    startDrawingPositionY: null,
    groups: [],
    ratio: null,
    scale: null,
    naturalScale: null
  };

  stage;
  layer;
  rect;
  group;

  componentDidMount() {
    const { canvasHeight, canvasWidth } = this.state;

    // создаем Stage - канвас, для рисования
    this.stage = new Konva.Stage({
      container: 'container',
      width: canvasWidth,
      height: canvasHeight,
    });

    this.layer = new Konva.Layer();

    // доавбляем изображение для модерации
    const imageObj = new Image();
    imageObj.onload = (e) => {

      const imageNaturalHeight = e.target.naturalHeight;
      const imageNaturalWidth = e.target.naturalWidth;

      // расчитываем необходимый ресайз изображения под канвас
      const imageSize = this.calculateAspectRatioFit(imageNaturalWidth, imageNaturalHeight, canvasWidth, canvasHeight);

      // расчитываем скейл для позиционирования по центру
      this.calculateScale(imageSize.width, imageSize.height);
      const left = imageSize.width * this.state.scale;
      const top = imageSize.height * this.state.scale;

      this.setState({
         shiftX: canvasWidth / 2 -  left / 2,
         shiftY: canvasHeight / 2 - top / 2,
      });

      const { shiftX, shiftY } = this.state;

      // добавляем изображения
      const imageToDetect = new Konva.Image({
        x: shiftX,
        y: shiftY,
        // x: 0,
        // y: 0,
        image: imageObj,
        width: imageSize.width,
        height: imageSize.height,
      });

      //imageToDetect.rotate(90)

      // обновляем леер
      this.layer.add(imageToDetect);
      this.layer.draw();
    };
    imageObj.src = 'https://pp.userapi.com/c639725/v639725381/6664/cCh0WZjFyec.jpg';

    this.stage.on('click tap',  (e) => {
      // // if click on empty area - remove all transformers
      // if (e.target === this.stage) {
      //   this.stage.find('Transformer').destroy();
      //   this.layer.draw();
      //   return;
      // }
      // // do nothing if clicked NOT on our rectangles
      // if (!e.target.hasName('rect')) {
      //   return;
      // }
      // // remove old transformers
      // // TODO: we can skip it if current rect is already selected
      // this.stage.find('Transformer').destroy();

      // create new transformer
      const tr = new Konva.Transformer();
      this.layer.add(tr);
      tr.attachTo(e.target);
      this.layer.draw();
    });

    this.stage.on('mousedown', (e) => {
      console.log(e.evt);

      if ( e.target.hasName('rect') ) {
        return
      }

      this.setState({
        isDrawing: true,
        startDrawingPositionX: e.evt.layerX,
        startDrawingPositionY: e.evt.layerY,
      });

      // создаем группу, в которой хранится рект и иконка удаления
      this.group = new Konva.Group({
        x: e.evt.layerX,
        y: e.evt.layerY,
        draggable: true,
        id: updateCount(count)
      });

      this.rect = new Konva.Rect({
        x: e.evt.layerX,
        y: e.evt.layerY,
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

      // добавляем событие удаления только по клику на иконку крестика
      this.state.groups.forEach(item => item.on('click', (e) => {

        if (!e.target.attrs.image) {
          return
        }

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

    // рисуем рект, при этом отменяем всплытие события для того, чтобы при днд не рисовать еще один рект
    this.stage.on('mousemove', (e) => {
      e.cancelBubble = true;

      if (!this.state.isDrawing) {
        return
      }

      this.rect.attrs.width = e.evt.layerX - this.state.startDrawingPositionX;
      this.rect.attrs.height = e.evt.layerY - this.state.startDrawingPositionY;

      this.layer.draw();
    });

    // проверяем условия ректа и добавляем иконку удаления
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
    const { ratio, shiftX, shiftY } = this.state;
    let groupsCoordinates = [];

    class CoordsWithResizeToOriginalImage {
      constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
      }
    }

    this.state.groups.forEach(group => {
      const { x, y, width, height } = group.getClientRect();

      groupsCoordinates.push( new CoordsWithResizeToOriginalImage(
          Math.round((x - shiftX) / ratio),
          Math.round((y - shiftY) / ratio),
          Math.round(width / ratio),
          Math.round(height / ratio)
      ))
    });
    console.log(JSON.stringify(groupsCoordinates));
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

  calculateScale = (imgWidth, imgHeight) => {
    const { canvasWidth, canvasHeight } = this.state;

    this.setState({
      scale: Math.min(canvasWidth / imgWidth, canvasHeight / imgHeight)
    })
  };

  render() {
    return (
        [<div key='1' id='container' style={ { border: '5px solid black', width: '700px', height: '450px', margin: '25px 0' } } />, <button onClick={ this.handleGetData } key='2'>get rects</button>]

    );
  }
}

export default App;
