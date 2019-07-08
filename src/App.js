import React, { Component } from 'react';
import Konva from 'konva';
import './App.css';

const image = 'https://pp.userapi.com/c543106/v543106905/4a3c5/AGfDzFGLFxc.jpg';

const reverse = (r1, r2) => {
  let r1x = r1.x, r1y = r1.y, r2x = r2.x,  r2y = r2.y, d;
  if (r1x > r2x ){
    d = Math.abs(r1x - r2x);
    r1x = r2x; r2x = r1x + d;
  }
  if (r1y > r2y ){
    d = Math.abs(r1y - r2y);
    r1y = r2y; r2y = r1y + d;
  }
  return ({x1: r1x, y1: r1y, x2: r2x, y2: r2y}); // return the corrected rect.
};

const updateDrag = (posNow, posStart, group, rect, layer) => {
  // update rubber rect position
  let posRect = reverse(posStart, posNow);
  group.x(posRect.x1);
  group.y(posRect.y1);
  rect.width(posRect.x2 - posRect.x1);
  rect.height(posRect.y2 - posRect.y1);
  rect.visible(true);
  layer.draw();
};

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
  imageToDetect;
  crossImage;

  componentDidMount() {
    const { canvasHeight, canvasWidth } = this.state;

    // создаем Stage - канвас, для рисования
    this.stage = new Konva.Stage({
      container: 'container',
      width: canvasWidth,
      height: canvasHeight
    });

    this.layer = new Konva.Layer();

    // доавбляем изображение для модерации
    const imageObj = new Image();
    imageObj.onload = (e) => {

      const imageNaturalHeight = e.target.naturalHeight;
      const imageNaturalWidth = e.target.naturalWidth;

      // расчитываем необходимый ресайз изображения под канвас
      const imageSize = this.calculateAspectRatioFit(
          imageNaturalWidth,
          imageNaturalHeight,
          canvasWidth,
          canvasHeight
      );

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
      this.imageToDetect = new Konva.Image({
        x: shiftX,
        y: shiftY,
        image: imageObj,
        width: imageSize.width,
        height: imageSize.height
      });

      // обновляем леер
      this.layer.add(this.imageToDetect);
      this.layer.draw();
    };
    imageObj.src = image;

    // Удаляем трансофрме со стейджа, по клику в любое место, кроме ректа
    this.stage.on('click',  (e) => {
      const anchors = this.group.getChildren((node) => node.getClassName() === 'Circle');

      if (anchors.length > 4) {
        anchors.forEach(anchor => anchor.destroy());
        this.layer.draw();
      }

    });

    this.stage.on('mousedown', (e) => {

      if (e.target.getClassName() === 'Circle') {
          return;
      }

      if (e.target.hasName('rect')) {
        return;
      }

      if (e.target.hasName('CROSS_IMAGE')) {
        return;
      }

      const { evt: { layerX, layerY } } = e;
      const { attrs: imageToDetectAttrs } = this.imageToDetect;

      const imageToDetectX1 = imageToDetectAttrs.x;
      const imageToDetectX2 = imageToDetectAttrs.x + imageToDetectAttrs.width;
      const imageToDetectY1 = imageToDetectAttrs.y;
      const imageToDetectY2 = imageToDetectAttrs.y + imageToDetectAttrs.height;

      // если кликаем за областью фотокарточки, то не даем пользователю рисовать
      // слева по х
      if (layerX < imageToDetectX1) {
        return
      }

      // справа по х
      if (layerX > imageToDetectX2) {
        return
      }

      // сверху по у
      if (imageToDetectY1 > layerY) {
        return
      }

      // снизу по у
      if (imageToDetectY2 < layerY) {
        return
      }

      this.setState({
        isDrawing: true,
        startDrawingPositionX: e.evt.layerX,
        startDrawingPositionY: e.evt.layerY
      });

      // создаем группу, в которой хранится рект и иконка удаления
      this.group = new Konva.Group({
        name: 'group'
      });

      this.group.on('dragmove', (e) => {
        const rect = e.target;
        const { scaleX, scaleY } = rect.attrs;

        const crossImage = rect.parent.getChildren(function(node) {
          return node.getClassName() === 'Image';
        })[0];

        const rectWidth = rect.attrs.width * scaleX;
        const rectHeight = rect.attrs.height * scaleY;

        const groupPositionX = rect.attrs.x;
        const groupPositionY = rect.attrs.y;

        const { attrs: imageToDetectAttrs } = this.imageToDetect;
        const imageToDetectX1 = imageToDetectAttrs.x;
        const imageToDetectX2 = imageToDetectAttrs.x + imageToDetectAttrs.width;
        const imageToDetectY1 = imageToDetectAttrs.y;
        const imageToDetectY2 = imageToDetectAttrs.y + imageToDetectAttrs.height;

        // для запрета сдвига в право
        const sumX = groupPositionX + rectWidth;

        // для запрета сдвига вниз
        const sumY = groupPositionY + rectHeight;

        // запрет выхода за правый край по Х
        if ( sumX >= imageToDetectX2) {
          rect.attrs.x = imageToDetectX2 - rectWidth;
        }

        // запрет выхода за левый край по Х
        if (groupPositionX <= imageToDetectX1) {
          rect.attrs.x = imageToDetectX1;
        }

        // запрет выхода наверх по Y
        if (groupPositionY <= imageToDetectY1) {
          rect.attrs.y = imageToDetectY1;
        }

        // запрет выходна вниз по Y
        if ( sumY >= imageToDetectY2 ) {
          rect.attrs.y = imageToDetectY2 - rectHeight;
        }

        // вновь центрируем крестик для удаления
        crossImage.x(this.getCenteredCoords(
            rect.attrs.x,
            rectWidth,
            crossImage.attrs.width
        ));

        crossImage.y(this.getCenteredCoords(
            rect.attrs.y,
            rectHeight,
            crossImage.attrs.height
        ));

        let topLeft = this.group.find('.topLeft')[0];
        let topRight = this.group.find('.topRight')[0];
        let bottomRight = this.group.find('.bottomRight')[0];
        let bottomLeft = this.group.find('.bottomLeft')[0];

        if (topLeft) {
          topLeft.y(this.rect.y());
          topLeft.x(this.rect.x());
        }

        if (topRight) {
          topRight.x(this.rect.x() + this.rect.width());
          topRight.y(this.rect.y());
        }

        if (bottomLeft) {
          bottomLeft.x(this.rect.x());
          bottomLeft.y(this.rect.y() + this.rect.height());
        }

        if (bottomRight) {
          bottomRight.x(this.rect.x() + this.rect.width());
          bottomRight.y(this.rect.height() + this.rect.y())
        }
      });

      this.rect = new Konva.Rect({
        x: e.evt.layerX,
        y: e.evt.layerY,
        width: 0,
        height: 0,
        fill: 'rgba(255, 255, 255, 0.7)',
        stroke: 'black',
        overflow: 'hidden',
        cursor: 'pointer',
        strokeWidth: 1,
        name: 'rect',
        draggable: true
      });

      this.layer.draw();

      this.setState({
        groups: [...this.state.groups, this.group]
      });

      // добавляем событие удаления только по клику на иконку крестика
      this.state.groups.forEach(item => item.on('click', (e) => {
        if (e.target.attrs.image) {
          this.setState({
            groups: this.state.groups.filter(groupItem => groupItem._id !== item._id)
          });

          this.stage.find('Transformer').destroy();
          item.remove();
          this.layer.draw();
          return
        }

        // код для создания якорей,
        // служит более удобным вариантом трансформера, который предоставляется из коробки
        const buildAnchor = (group, x, y, name) => {

          const update = (activeAnchor) => {
            activeAnchor.setDraggable(true);
            let group = activeAnchor.getParent();
            let topLeft = group.find('.topLeft')[0];
            let topRight = group.find('.topRight')[0];
            let bottomRight = group.find('.bottomRight')[0];
            let bottomLeft = group.find('.bottomLeft')[0];
            let rect = this.rect;
            let anchorX = activeAnchor.getX();
            let anchorY = activeAnchor.getY();

            switch (activeAnchor.getName()) {
              case 'topLeft':
                topRight.y(anchorY);
                bottomLeft.x(anchorX);
                break;
              case 'topRight':
                topLeft.y(anchorY);
                bottomRight.x(anchorX);
                break;
              case 'bottomRight':
                bottomLeft.y(anchorY);
                topRight.x(anchorX);
                break;
              case 'bottomLeft':
                bottomRight.y(anchorY);
                topLeft.x(anchorX);
                break;
              default: alert('Ошибка при обновлении позиционирования якорей')
            }

            rect.position(topLeft.position());

            const width = topRight.getX() - topLeft.getX();
            const height = bottomLeft.getY() - topLeft.getY();

            if (width <= 30) {
              rect.width(30);
              return;
            }

            if (height <= 30) {
              rect.height(30);
              return;
            }

            if (width && height) {
              rect.width(width);
              rect.height(height);
            }

            // const currentCrossImage = activeAnchor.parent.getChildren(
            //     (node) => node.getClassName() === 'Image'
            // )[0];
            // console.log(currentCrossImage);
            // currentCrossImage.x(100)

          };

          const anchor = new Konva.Circle({
            x: x,
            y: y,
            strokeWidth: 0.5,
            stroke: '#000',
            fill: '#fff',
            radius: 4,
            name: name,
            draggable: true,
            dragOnTop: false,
            cursor: 'pointer'
          });

          anchor.on('dragmove', (e) => {
            const { layerX, layerY } = e.evt;

            const rectWidth = this.rect.width();
            const rectXPosition = this.rect.x();

            const rectHeight = this.rect.height();
            const rectYPosition = this.rect.y();

            if (rectWidth === 30) {
              if (layerX < rectXPosition) {
                update(e.target);
                return;
              }

              if (layerX >= rectXPosition + rectWidth && e.target.name() === 'topRight') {
                update(e.target);
                return;
              }

              if (layerX >= rectXPosition + rectWidth && e.target.name() === 'bottomRight') {
                update(e.target);
                return;
              }

              return;
            }

            if (rectHeight === 30) {
              if (layerY < rectYPosition) {
                update(e.target);
                return;
              }

              if (layerY >= rectYPosition + rectHeight && e.target.name() === 'bottomRight') {
                update(e.target);
                return;
              }

              if (layerY >= rectYPosition + rectHeight && e.target.name() === 'bottomLeft') {
                update(e.target);
                return;
              }

              return;
            }

            update(e.target);
          });

          anchor.on('mousedown', (e) => {
            e.target.setDraggable(true);
            this.group.setDraggable(false);
            anchor.moveToTop();
          });

          anchor.on('dragend', () => {
            this.group.setDraggable(true);
          });

          this.group.add(anchor);
          this.layer.draw();
        };

        buildAnchor(
            this.group,
            this.rect.attrs.x,
            this.rect.attrs.y,
            'topLeft'
        );

        buildAnchor(
            this.group,
            this.rect.attrs.x + this.rect.attrs.width,
            this.rect.attrs.y,
            'topRight'
        );

        buildAnchor(
            this.group,
            this.rect.attrs.x,
            this.rect.attrs.y + this.rect.attrs.height,
            'bottomLeft'
        );

        buildAnchor(
            this.group,
            this.rect.attrs.x + this.rect.attrs.width,
            this.rect.attrs.y + this.rect.attrs.height,
            'bottomRight'
        );

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

      if (!this.imageToDetect) {
        return
      }

      const { attrs: imageToDetectAttrs } = this.imageToDetect;

      let posNow = { x: e.evt.layerX, y: e.evt.layerY };
      let posStart = { x: this.state.startDrawingPositionX, y: this.state.startDrawingPositionY };

      const imageToDetectX1 = imageToDetectAttrs.x;
      const imageToDetectX2 = imageToDetectAttrs.x + imageToDetectAttrs.width;
      const imageToDetectY1 = imageToDetectAttrs.y;
      const imageToDetectY2 = imageToDetectAttrs.y + imageToDetectAttrs.height;

      // даем возможность рисовать только в рамках изображения
      if (posNow.x < imageToDetectX1) {
        posNow.x = imageToDetectX1;
      }

      if (posNow.x > imageToDetectX2) {
        posNow.x = imageToDetectX2;
      }

      if (posNow.y < imageToDetectY1) {
        posNow.y = imageToDetectY1;
      }

      if (posNow.y > imageToDetectY2) {
        posNow.y = imageToDetectY2
      }

      if (!this.state.isDrawing) {
        return
      }

      updateDrag(
          posNow,
          posStart,
          this.rect,
          this.rect,
          this.layer
      );
    });

    // проверяем условия ректа, если он мини, то дополняем его до минимальных размеров и добавляем иконку удаления
    this.stage.on('mouseup', () => {

      const { isDrawing } = this.state;

      if (!isDrawing) {
        return
      }

      const { attrs } = this.rect;

      const rectHeight = Math.abs(attrs.height);
      const rectWidth = Math.abs(attrs.width);

      if (rectWidth === 0 && rectHeight === 0) {
        this.group.remove();
        this.layer.draw();
        return;
      }

      if (rectHeight < 20) {
        attrs.height = 30;
      }

      if (rectWidth < 20) {
        attrs.width = 30;
      }

      const imageToDetectX2 = this.imageToDetect.attrs.x + this.imageToDetect.attrs.width;
      const imageToDetectY2 = this.imageToDetect.attrs.y + this.imageToDetect.attrs.height;

      const rectX2 = attrs.width + attrs.x;
      const rectY2 = attrs.height + attrs.y;

      // если рисуем около границы и он выезжает за ее пределы
      // внизу
      if (rectX2 > imageToDetectX2) {
        this.rect.x(imageToDetectX2 - this.rect.attrs.width);
      }
      // справа
      if (rectY2 > imageToDetectY2) {
        this.rect.y(imageToDetectY2 - this.rect.attrs.height);
      }

      this.layer.draw();

      const crossImageObj = new Image();

      crossImageObj.onload = () => {

        const imageSize = 15;

        this.crossImage = new Konva.Image({
          x: this.getCenteredCoords(this.rect.attrs.x, this.rect.attrs.width, imageSize),
          y: this.getCenteredCoords(this.rect.attrs.y, this.rect.attrs.height, imageSize),
          image: crossImageObj,
          width: imageSize,
          height: imageSize,
          keepRatio: true,
          name: 'CROSS_IMAGE'
        });

        this.group.add(this.crossImage);
        this.layer.draw();
      };

      crossImageObj.src = 'https://image.flaticon.com/icons/svg/463/463065.svg';

      this.setState({
        isDrawing: false,
      })
    });

    this.stage.add(this.layer);
  }

  getCenteredCoords = (axisRectCoordinate, rectMetrics, sizeOfContent) => {
    return axisRectCoordinate + (rectMetrics - sizeOfContent) / 2;
  };

  handleGetData = () => {
    const { ratio, shiftX, shiftY } = this.state;
    let groupsCoordinates = [];

    class CoordsWithResizeToOriginalImage {
      constructor(x, y, width, height) {
        this.x = x;
        this.x1 = x + width;
        this.y = y;
        this.y1 = y + height;
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

    const filteredGroupsCoordinates = groupsCoordinates.filter(item => {

      return item;
    });

    console.log(JSON.stringify(filteredGroupsCoordinates));
    this.setState({
      cords: filteredGroupsCoordinates
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
