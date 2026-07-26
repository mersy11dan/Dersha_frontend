import { Router, Request, Response } from "express";
import {
  authenticate,
  requireVerifiedAccount,
} from "../../middleware/auth.middleware";
import { validateRequest } from "../../middleware/validator.middleware";
import { OrderPlacementSchema } from "../../schemas/order.schema";
import { marketService } from "../../services/market.service";
import { orderService } from "../../services/order.service";
import { portfolioService } from "../../services/portfolio.service";
import { asyncHandler } from "../../utils/asyncHandler";
import { requestContext } from "../../utils/requestContext";

const marketRouter = Router();
const ordersRouter = Router();
const portfolioRouter = Router();

marketRouter.use(authenticate, requireVerifiedAccount);
ordersRouter.use(authenticate, requireVerifiedAccount);
portfolioRouter.use(authenticate, requireVerifiedAccount);

// --- Market data -----------------------------------------------------------

marketRouter.get(
  "/assets",
  asyncHandler(async (req: Request, res: Response) => {
    const assets = await marketService.listSubFunds({
      category: req.query.category as string | undefined,
      status: req.query.status as string | undefined,
      search: req.query.search as string | undefined,
    });
    res.status(200).json({ success: true, data: assets });
  }),
);

marketRouter.get(
  "/highlights",
  asyncHandler(async (_req: Request, res: Response) => {
    res.status(200).json({ success: true, data: await marketService.getHighlights() });
  }),
);

marketRouter.get(
  "/assets/:subFundId",
  asyncHandler(async (req: Request, res: Response) => {
    const asset = await marketService.getSubFund(String(req.params.subFundId));
    res.status(200).json({ success: true, data: asset });
  }),
);

marketRouter.get(
  "/assets/:subFundId/order-book",
  asyncHandler(async (req: Request, res: Response) => {
    const book = await marketService.getOrderBook(String(req.params.subFundId));
    res.status(200).json({ success: true, data: book });
  }),
);

// --- Orders ----------------------------------------------------------------

ordersRouter.post(
  "/",
  validateRequest(OrderPlacementSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const order = await orderService.placeOrder(
      req.user!.userId,
      req.body,
      requestContext(req),
    );
    res.status(201).json({
      success: true,
      message:
        order.status === "FILLED"
          ? "Order filled."
          : "Order placed on the book.",
      data: order,
    });
  }),
);

ordersRouter.get(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    const orders = await orderService.listOrders(
      req.user!.userId,
      req.query.status as string | undefined,
    );
    res.status(200).json({ success: true, data: orders });
  }),
);

ordersRouter.get(
  "/:orderId",
  asyncHandler(async (req: Request, res: Response) => {
    const order = await orderService.describeOrder(String(req.params.orderId));
    res.status(200).json({ success: true, data: order });
  }),
);

ordersRouter.post(
  "/:orderId/cancel",
  asyncHandler(async (req: Request, res: Response) => {
    const result = await orderService.cancelOrder(
      req.user!.userId,
      String(req.params.orderId),
    );
    res.status(200).json({
      success: true,
      message: "Order cancelled and collateral released.",
      data: result,
    });
  }),
);

// --- Portfolio -------------------------------------------------------------

portfolioRouter.get(
  "/summary",
  asyncHandler(async (req: Request, res: Response) => {
    const summary = await portfolioService.getSummary(req.user!.userId);
    res.status(200).json({ success: true, data: summary });
  }),
);

portfolioRouter.get(
  "/holdings",
  asyncHandler(async (req: Request, res: Response) => {
    const holdings = await portfolioService.getHoldings(req.user!.userId);
    res.status(200).json({ success: true, data: holdings });
  }),
);

portfolioRouter.get(
  "/activity",
  asyncHandler(async (req: Request, res: Response) => {
    const activity = await portfolioService.getActivity(
      req.user!.userId,
      Math.min(Number(req.query.limit) || 20, 100),
    );
    res.status(200).json({ success: true, data: activity });
  }),
);

export { marketRouter, ordersRouter, portfolioRouter };
