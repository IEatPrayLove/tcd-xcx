
import { POSTER_URL } from './baseUrl'
import { formatSaleCount, getServerPic } from '../utils/utils'

// 门店海报配置
export const merchantPoster = ({ posterUrl, qrUrl }) => {
  return (
    {
      width: 750,
      height: 1334,
      backgroundColor: '#fff',
      debug: false,
      images: [
        {
          url: posterUrl,
          width: 750,
          height: 1334,
          y: 0,
          x: 0,
          zIndex: 10
        },
        {
          url: getServerPic(qrUrl),
          width: 120,
          height: 120,
          x: 315,
          y: 1193,
          zIndex: 12
        }
      ]
    }
  )
}

// 通吃卡海报配置
export const tcdPoster = url => {
  return (
    {
      width: 750,
      height: 1334,
      backgroundColor: '#fff',
      debug: false,
      images: [
        {
          url: 'https://cydl-resource.oss-cn-zhangjiakou.aliyuncs.com/island-zhuancan/generatepPosters.png',
          width: 750,
          height: 1334,
          y: 0,
          x: 0,
          zIndex: 10
        },
        {
          url: getServerPic(url),
          width: 120,
          height: 120,
          x: 228,
          y: 1193,
          zIndex: 12
        }
      ]
    }
  )
}

// 平台海报设置
export const platformPoster = ({ codeUrl, posterUrl }) => {
  return (
    {
      width: 750,
      height: 1334,
      backgroundColor: '#fff',
      debug: false,
      images: [
        {
          url: getServerPic(posterUrl),
          width: 750,
          height: 1334,
          y: 0,
          x: 0,
          zIndex: 10
        },
        {
          url: getServerPic(codeUrl),
          width: 120,
          height: 120,
          x: 315,
          y: 1193,
          zIndex: 12
        }
      ]
    }
  )
}


// 商品海报配置
export const productPoster = ({
  headPic,
  imagePath,
  codeUrl,
  nickName,
  dishName,
  description,
  price,
  OriginalPrice,
  shopDishSkus,
  merchant_name,
  address,
  principal_mobile,
  buyEarn
}) => {
  const template = {
    width: 750,
    height: 1334,
    backgroundColor: '#ffffff',
    debug: false,
    blocks: [
      {
        x: 45,
        y: 620,
        width: 660,
        height: 110,
        borderRadius: 40,
        backgroundColor: '#ffffff',
        zIndex: 3
      },
      {
        x: 45,
        y: 710,
        width: 660,
        height: 374,
        borderRadius: 10,
        backgroundColor: '#ffffff',
        zIndex: 4
      }
    ],
    images: [
      {
        url: `${POSTER_URL}/product_poster_bg.png`,
        width: 750,
        height: 1135,
        y: 0,
        x: 0,
        zIndex: 1
      },
      {
        url: getServerPic(headPic),
        width: 80,
        height: 80,
        x: 45,
        y: 141,
        borderRadius: 80,
        zIndex: 2
      },
      {
        url: getServerPic(imagePath.split(',')[0]),
        width: 660,
        height: 400,
        x: 45,
        y: 250,
        borderRadius: 10,
        zIndex: 2
      },
      {
        url: `${POSTER_URL}/poster_group.png`,
        width: 334,
        height: 106,
        x: 66,
        y: 934,
        zIndex: 5
      },
      {
        url: getServerPic(codeUrl),
        width: 132,
        height: 132,
        x: 576,
        y: 1170
      },
      {
        url: `${POSTER_URL}/more.png`,
        width: 148,
        height: 186,
        x: 534,
        y: 938,
        zIndex: 6
      },
      {
        url: `${POSTER_URL}/press.png`,
        width: 265,
        height: 36,
        x: 46,
        y: 1274
      }
    ],
    texts: [
      {
        x: 138,
        y: 147,
        text: nickName,
        fontSize: 26,
        fontWeight: 'bold',
        color: '#FFFFFF',
        zIndex: 2,
        baseLine: 'top'
      },
      {
        x: 138,
        y: 186,
        text: '倾情分享“优质商品”',
        fontSize: 22,
        fontWeight: 'bold',
        color: '#FFD9D2',
        zIndex: 2,
        baseLine: 'top'
      },
      {
        x: 66,
        y: 660,
        fontSize: 30,
        width: 600,
        color: '#333333',
        text: dishName,
        baseLine: 'top',
        lineNum: 3,
        lineHeight: 40,
        zIndex: 5
      },
      // {
      //   x: 66,
      //   y: 710,
      //   fontSize: 24,
      //   width: 600,
      //   lineNum: 2,
      //   lineHeight: 34,
      //   color: '#999999',
      //   text: description || '',
      //   baseLine: 'top',
      //   zIndex: 5
      // },
      {
        x: 66,
        y: 820,
        fontSize: 22,
        color: '#FF623D',
        text: '￥',
        baseLine: 'top',
        fontWeight: 'bold',
        zIndex: 5
      },
      {
        x: 90,
        y: 800,
        fontSize: 50,
        color: '#FF623D',
        text: price,
        baseLine: 'top',
        fontWeight: 'bold',
        zIndex: 5
      },
      {
        x: 558,
        y: 860,
        fontSize: 24,
        color: '#999999',
        text: `销量：${formatSaleCount(shopDishSkus)}`,
        baseLine: 'top',
        zIndex: 5
      },
      {
        x: 46,
        y: 1160,
        text: merchant_name,
        fontWeight: 'bold',
        fontSize: 26,
        baseLine: 'top',
        color: '#333333'
      },
      {
        x: 46,
        y: 1204,
        text: `门店地址：${address}`,
        fontSize: 22,
        color: '#333333',
        baseLine: 'top',
        width: 368
      },
      {
        x: 46,
        y: 1235,
        text: `商家电话：${principal_mobile}`,
        fontSize: 22,
        color: '#333333',
        baseLine: 'top',
        width: 368
      }
    ],
    lines: [
      {
        startY: 906,
        startX: 66,
        endX: 686,
        endY: 906,
        width: 1,
        color: '#E5E5E5',
        zIndex: 5
      }
    ]
  }
  if (OriginalPrice && OriginalPrice > 0) {
    template.texts.push({
      x: 66,
      y: 860,
      fontSize: 24,
      color: '#999999',
      text: `门店价：￥${OriginalPrice}`,
      baseLine: 'top',
      zIndex: 5
    })
  }
  if (buyEarn && buyEarn > 0) {
    template.texts.push({
      x: 236,
      y: 826,
      text: `通吃卡再省￥${buyEarn}`,
      fontSize: 16,
      color: '#DBC194',
      baseLine: 'top',
      zIndex: 6
    })
    template.images.push({
      url: `${POSTER_URL}/poster_tc_bg.png`,
      height: 26,
      width: 166,
      x: 200,
      y: 822,
      zIndex: 5
    })
  }
  console.log(template)
  return template
}


// 公众号二维码海报
export const publicQR = ({ qrUrl }) => {
  return (
    {
      width: 750,
      height: 1208,
      backgroundColor: '#fff',
      debug: false,
      images: [
        {
          url: 'https://cydl-resource.oss-cn-zhangjiakou.aliyuncs.com/island-zhuancan/service_bg.png',
          width: 750,
          height: 1208,
          y: 0,
          x: 0,
          zIndex: 10
        },
        {
          url: getServerPic(qrUrl),
          width: 240,
          height: 240,
          x: 255,
          y: 680,
          zIndex: 12
        }
      ]
    }
  )
}