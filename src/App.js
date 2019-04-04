import React, { Component } from 'react';
import Konva from 'konva';
import './App.css';

const image = 'https://pp.userapi.com/c849228/v849228696/9afdb/G-PBRGJK3I4.jpg';

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
    naturalScale: null,
    cords: [{width: 0, height: 0, x: 0, y: 0}]
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
    imageObj.src = image;

    // Удаляем трансофрме со стейджа, по клику в любое место, кроме ректа
    this.stage.on('click',  (e) => {
      if ( e.target.hasName('rect')) {
        return
      }
      this.stage.find('Transformer').destroy();
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
        name: 'group',
      });

      this.group.on('dragmove', function(e) {
        const rect = e.target.getChildren(function(node) {
          return node.getClassName() === 'Rect'
        })[0];

        const rectWidth = rect.attrs.width;
        const rectHeight = rect.attrs.height;

        const groupPositionX = e.target.attrs.x;
        const groupPositionY = e.target.attrs.y;

        // для запрета сдвига в право
        const sumX = groupPositionX + rectWidth;

        // для запрета сдвига вниз
        const sumY = groupPositionY + rectHeight;

        // запрет выхода за правый край по Х
        if ( sumX >= canvasWidth) {
          e.target.attrs.x = canvasWidth - rectWidth;
        }

        // запрет выхода за левый край по Х
        if (groupPositionX <= 0) {
          e.target.attrs.x = 0
        }

        // запрет выхода наверх по Y
        if (groupPositionY < 0) {
          e.target.attrs.y = 0
        }

        // запрет выходна вниз по Y
        if ( sumY >= canvasHeight ) {
          e.target.attrs.y = canvasHeight - rectHeight;
        }

      });

      this.rect = new Konva.Rect({
        x: 0,
        y: 0,
        width: 0,
        height: 0,
        fill: 'rgba(255, 255, 255, 0.7)',
        stroke: 'black',
        overflow: 'hidden',
        cursor: 'pointer',
        strokeWidth: 2,
        name: 'rect',
      });

      this.layer.draw();

      this.setState({
        groups: [...this.state.groups, this.group]
      });

      // добавляем событие удаления только по клику на иконку крестика
      this.state.groups.forEach(item => item.on('click', (e) => {
        this.stage.find('Transformer').destroy();
        if (!e.target.attrs.image) {

          const currentGroup = this.state.groups.filter(groupItem => groupItem._id === e.target.parent._id)[0];

          const transformer = new Konva.Transformer({
            node: currentGroup,
            enabledAnchors: ['top-left', 'top-right', 'bottom-left', 'bottom-right']
          });

          /* TODO calc width and height of rect after transform */
          currentGroup.on('transformend', (e) => {

          });

          this.layer.add(transformer);
          this.layer.draw();
          return
        }

        this.setState({
          groups: this.state.groups.filter(groupItem => groupItem._id !== item._id)
        });

        this.stage.find('Transformer').destroy();
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

      const crossImageObj = new Image();

      crossImageObj.onload = () => {

        const crossImage = new Konva.Image({
          x: 0,
          y: 0,
          image: crossImageObj,
          width: 50,
          height: 50,
          position: 'absolute'
        });

        //imageToDetect.rotate(90)

        // add the shape to the layer
        this.group.add(crossImage);
        // add the layer to the stage
        this.layer.draw();
      };

      crossImageObj.src = 'https://upload.wikimedia.org/wikipedia/ru/4/49/%D0%9F%D0%BE%D0%BA%D0%B5%D0%BC%D0%BE%D0%BD_%D0%98%D0%B2%D0%B8.png'

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
    this.setState({
      cords: groupsCoordinates
    })
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

    const { cords } = this.state;

    return (
        [
            <div key='1' id='container' style={ { border: '5px solid black', width: '700px', height: '450px', margin: '25px 0' } } />,
            <button onClick={ this.handleGetData } key='2'>get rects</button>,
            <div key='3' className='container' style={ { position: 'relative' } }>
              <img src={ image } alt=""/>
              { cords.map((item, index) => (
                  <div key={ index } style={ { height: item.height, width: item.width, top: item.y, left: item.x, position: 'absolute', background: 'rgba(0, 255, 2, 0.7)' } }>

                  </div>
              )) }

            </div>
        ]
    );
  }
}

export default App;
