import { Router, Request, Response } from "express";
import {
  authenticate,
  requireVerifiedAccount,
} from "../../middleware/auth.middleware";
import { validateRequest } from "../../middleware/validator.middleware";
import {
  BasketListingSchema,
  BasketMintSchema,
  BasketPurchaseSchema,
} from "../../schemas/basket.schema";
import { basketService } from "../../services/basket.service";
import { asyncHandler } from "../../utils/asyncHandler";
import { requestContext } from "../../utils/requestContext";

const basketsRouter = Router();

basketsRouter.use(authenticate, requireVerifiedAccount);

basketsRouter.get(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    const baskets = await basketService.listMine(req.user!.userId);
    res.status(200).json({ success: true, data: baskets });
  }),
);

basketsRouter.post(
  "/",
  validateRequest(BasketMintSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const basket = await basketService.mint(
      req.user!.userId,
      req.body,
      requestContext(req),
    );
    res.status(201).json({
      success: true,
      message: "Basket minted. Its constituents are now held in custody.",
      data: basket,
    });
  }),
);

// Declared before /:basketId so the literal segments are not read as an id.
basketsRouter.get(
  "/market",
  asyncHandler(async (req: Request, res: Response) => {
    const listings = await basketService.listMarket({
      saleMode: req.query.sale_mode as string | undefined,
    });
    res.status(200).json({ success: true, data: listings });
  }),
);

basketsRouter.get(
  "/royalties",
  asyncHandler(async (req: Request, res: Response) => {
    const earnings = await basketService.royaltyEarnings(req.user!.userId);
    res.status(200).json({ success: true, data: earnings });
  }),
);

basketsRouter.get(
  "/listings/:listingId",
  asyncHandler(async (req: Request, res: Response) => {
    const listing = await basketService.describeListing(
      String(req.params.listingId),
    );
    res.status(200).json({ success: true, data: listing });
  }),
);

basketsRouter.post(
  "/listings/:listingId/buy",
  validateRequest(BasketPurchaseSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const receipt = await basketService.buy(
      req.user!.userId,
      String(req.params.listingId),
      req.body,
      requestContext(req),
    );
    res.status(200).json({
      success: true,
      message: "Basket shares purchased.",
      data: receipt,
    });
  }),
);

basketsRouter.post(
  "/listings/:listingId/cancel",
  asyncHandler(async (req: Request, res: Response) => {
    const listing = await basketService.cancelListing(
      req.user!.userId,
      String(req.params.listingId),
    );
    res.status(200).json({
      success: true,
      message: "Listing cancelled and basket shares released.",
      data: listing,
    });
  }),
);

basketsRouter.get(
  "/:basketId",
  asyncHandler(async (req: Request, res: Response) => {
    const basket = await basketService.get(
      String(req.params.basketId),
      req.user!.userId,
    );
    res.status(200).json({ success: true, data: basket });
  }),
);

basketsRouter.post(
  "/:basketId/list",
  validateRequest(BasketListingSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const listing = await basketService.createListing(
      req.user!.userId,
      String(req.params.basketId),
      req.body,
      requestContext(req),
    );
    res.status(201).json({
      success: true,
      message: "Basket listed on the hybrid market.",
      data: listing,
    });
  }),
);

basketsRouter.post(
  "/:basketId/nav/recalculate",
  asyncHandler(async (req: Request, res: Response) => {
    const nav = await basketService.recalculateNav(String(req.params.basketId));
    res.status(200).json({ success: true, data: nav });
  }),
);

basketsRouter.post(
  "/:basketId/dissolve",
  asyncHandler(async (req: Request, res: Response) => {
    const result = await basketService.dissolve(
      req.user!.userId,
      String(req.params.basketId),
    );
    res.status(200).json({
      success: true,
      message: "Basket dissolved and constituents returned to your holdings.",
      data: result,
    });
  }),
);

export { basketsRouter };
