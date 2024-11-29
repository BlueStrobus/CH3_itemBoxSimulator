import express from 'express';
import { prisma } from '../utils/prisma/index.js';

const router = express.Router();

/** 골드 업데이트 함수 */
async function updateCharacterGold(characterId, goldChange) {
    return prisma.characters.update({
        where: { characterId: +characterId },
        data: { money: { increment: goldChange } }, // 작동 확인하기
    });
}

/** 아이템 구매 API */
router.patch('/shop/purchase/:characterId', async (req, res, next) => {
    const { characterId } = req.params;
    const { itemId, count } = req.body;

    if (!itemId || !count) {
        return res.status(400).json({ message: '아이템 ID와 수량을 입력해주세요.' });
    }
    // 아이템 코드 유효성 검사
    const item = await prisma.items.findUnique({ where: { itemId: +itemId } });
    if (!item) return res.status(400).json({ message: '존재하지 않는 아이템입니다.' });

    // 비용확인
    const totalCost = item.price * count;
    const character = await prisma.characters.findUnique({ where: { characterId: +characterId } });
    if (character.money < totalCost) {
        return res.status(400).json({ message: '금액이 부족합니다.' });
    }

    try {
        await prisma.$transaction(async () => {
            await updateCharacterGold(characterId, -totalCost);
            await prisma.characterInventory.create({
                data: {
                    characterId: +characterId,
                    itemId: item.itemId,
                    itemCount: count,
                },
            });
        });

        return res.status(201).json({
            message: `${item.itemName}을(를) ${count}개 구매하였습니다. 현재 보유 금액은 ${Character.characterMoney}골드입니다.`,
        });
    } catch (err) {
        console.log('아이템 구매 중 오류 발생');
        return err;
    }
});

/** 아이템 판매 API */
router.delete('/shop/sell/:characterId', async (req, res, next) => {
    const { characterId } = req.params;
    const { itemId, count } = req.body;

    if (!itemId || !count) {
        return res.status(400).json({ message: '아이템 ID와 수량을 입력해주세요.' });
    }

    // 아이템 유효성 검사
    const inventoryItem = await prisma.characterInventory.findFirst({
        where: { characterId: +characterId, itemId: +itemId },
    });

    if (!inventoryItem || inventoryItem.itemCount < count) {
        return res.status(400).json({ message: '판매 가능한 수량이 부족합니다.' });
    }

    const item = await prisma.items.findUnique({ where: { itemId: +itemId } });
    const sellPrice = item.price * 0.6 * count;

    try {
        await prisma.$transaction(async () => {
            await updateCharacterGold(characterId, sellPrice);
            await prisma.characterInventory.update({
                where: { characterInventoryId: inventoryItem.characterInventoryId },
                data: { itemCount: { decrement: count } },
            });
        });

        return res.status(201).json({
            message: `${sellItems[0].itemName}을(를) ${count}개 판매하였습니다. 현재 보유 금액은 ${updatedCharacter.characterMoney}골드입니다.`,
        });
    } catch (err) {
        console.log('아이템 판매 중 오류 발생');
        next(err);
    }
});

export default router;
