const Router = require('express')
const router = new Router()
const deviceRouter = require('./deviceRouter')
const brandRouter = require('./brandRouter')
const typeRouter = require('./typeRouter')
const userRouter = require('./userRouter')
const basketRouter = require('./basketRouter')
const orderRouter = require('./orderRouter')
const comparisonRouter = require('./comparisonRouter')
const analyticsRouter = require('./analyticsRouter')

router.use('/user', userRouter)
router.use('/type', typeRouter)
router.use('/brand', brandRouter)
router.use('/device', deviceRouter)
router.use('/cart', basketRouter)
router.use('/order', orderRouter)
router.use('/comparison', comparisonRouter)
router.use('/analytics', analyticsRouter)

module.exports = router