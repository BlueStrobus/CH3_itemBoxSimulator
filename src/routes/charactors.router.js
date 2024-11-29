// charactors.router.js
import express from 'express';
import dotenv from 'dotenv';
import { prisma } from '../utils/prisma/index.js';

dotenv.config();
const router = express.Router();

// 캐릭터
// 지정
// skinId name
// 디폴트, 자동생성
// characterId, level, hp, power, defense, speed, money, updatedAt,  createdAt

// 캐릭터 생성 API
// /character는 단순히 식별용 문자열일 뿐, 반드시 데이터베이스 테이블 이름과 일치할 필요는 없습니다.
router.post('/api/character', async (req, res, next) => {
    try {
        let { skinId, name } = req.body;

        // 캐릭터 이름 필수 입력값 확인
        if (!name || typeof name !== 'string' || name.trim().length === 0) {
            return res.status(400).json({ error: '캐릭터 이름을 입력해 주세요.' });
        }

        // 캐릭터 이름 유효성 검사
        if (name.length > 50) {
            return res.status(400).json({ error: '캐릭터 이름은 50글자를 넘을 수 없습니다.' });
        }

        // 캐릭터 이름 중복 확인
        const isExistingCharacterName = await prisma.characters.findFirst({ where: { name } });
        if (isExistingCharacterName) {
            return res.status(400).json({ message: '이미 존재하는 캐릭터 이름입니다.' });
        }

        // 스킨 유효성 확인 및 디폴트값 지정
        if (skinId) {
            const isExistingSkin = await prisma.skins.findFirst({ where: { skinId } });
            if (!isExistingSkin) {
                return res.status(400).json({ message: '존재하지 않는 스킨입니다. 스킨은 지정하지 않아도 됩니다.' });
            }
        } else {
            skinId = 0; // 디폴트 스킨 ID
        }

        // 캐릭터 생성
        const character = await prisma.characters.create({
            data: { skinId, name },
        });

        // 기본 아이템 지급
        const leatherItems = await prisma.items.findMany({
            where: { name: { startsWith: '일반 가죽' } }, // 이름이 '일반 가죽'으로 시작하는 아이템들
        });

        const inventoryData = leatherItems.map((item) => ({
            characterId: character.characterId,
            itemId: item.itemId,
            itemCount: 1,
        }));

        if (inventoryData.length > 0) {
            await prisma.characterInventory.createMany({ data: inventoryData });
        }

        return res.status(201).json({ message: '캐릭터 생성 및 기본 아이템 지급이 완료되었습니다.', data: character });
    } catch (err) {
        next(err);
    }
});

// 아이템 장착 API
router.post('/api/equip', async (req, res, next) => {
    try {
        const { character, item, mountingLocation } = req.body;
        // 해당 부위에 이미 아이템이 장착되어 있는지 확인
        const existingItem = await prisma.characterItems.findFirst({
            where: { characterId: character.characterId, mountingLocation },
        });

        // 조건에 맞는 아이템 조회
        const inventoryItem = await prisma.characterInventory.findFirst({
            where: { characterId: character.characterId, itemId: item.itemId },
        });

        if (!inventoryItem || inventoryItem.itemCount <= 0) {
            throw new Error('인벤토리에 해당 아이템이 없습니다.');
        }

        if (existingItem) {
            await unequipItem(character, existingItem); // 기존 아이템 해제
        }

        // 카운트 감소뿐 아니라 해당 데이터가 삭제되었는지 확인하기.
        await prisma.characterInventory.update({
            where: { characterItemId: inventoryItem.characterItemId },
            data: { itemCount: inventoryItem.itemCount - 1 },
        });

        /**
                    // 인벤토리에서 삭제
                    await tx.characterInventory.delete({
                        where: { itemId: item.itemId },
                    }); */

        await prisma.characterItems.create({
            data: {
                characterId: character.characterId,
                itemId: item.itemId,
                mountingLocation,
                /* // 테이블 선언시 디폴트값 있음
                iHp: item.iHp || 0,
                iPower: item.iPower || 0,
                iDefense: item.iDefense || 0,
                iSpeed: item.iSpeed || 0,
                */
            },
        });

        await prisma.characters.update({
            where: { characterId: character.characterId },
            data: {
                hp: character.hp + (item.iHp || 0),
                power: character.power + (item.iPower || 0),
                defense: character.defense + (item.iDefense || 0),
                speed: character.speed + (item.iSpeed || 0),
            },
        });

        return res.status(201).json({
            message: '아이템 장착이 완료되었습니다.',
        });
    } catch (err) {
        console.error('아이템 장착 중 오류:', err);
        next(err);
    }
});

// 아이템 해제
router.post('/api/unequip', async (req, res, next) => {
    try {
        const { character, item } = req.body;
        const characterItem = await prisma.characterItems.findFirst({
            where: { characterId: character.characterId, itemId: item.itemId },
        });

        if (!characterItem) {
            throw new Error('해당 아이템은 장착되지 않았습니다.');
        }

        // 아이템의 스탯만큼 캐릭터 스탯에서 차감
        await prisma.characters.update({
            where: { characterId: character.characterId },
            data: {
                hp: character.hp - (characterItem.iHp || 0),
                power: character.power - (characterItem.iPower || 0),
                defense: character.defense - (characterItem.iDefense || 0),
                speed: character.speed - (characterItem.iSpeed || 0),
            },
        });

        // 해당 아이템 레코드 삭제 (장착 해제)
        await prisma.characterItems.delete({ where: { characterItemId: characterItem.characterItemId } });

        const existingInventoryItem = await prisma.characterInventory.findFirst({
            where: { characterId: character.characterId, itemId: item.itemId },
        });

        // 아이템을 인벤토리에 추가
        if (existingInventoryItem) {
            await prisma.characterInventory.update({
                where: { characterItemId: existingInventoryItem.characterItemId },
                data: { itemCount: existingInventoryItem.itemCount + 1 },
            });
        } else {
            await prisma.characterInventory.create({
                data: { characterId: character.characterId, itemId: item.itemId, itemCount: 1 },
            });
        }
        return res.status(201).json({
            message: '아이템 해제가 완료되었습니다.',
        });
    } catch (err) {
        console.error('아이템 해제 중 오류:', err);
        next(err);
    }
});

// 캐릭터 전체 조회
router.get('/api/character', async (req, res, next) => {
    try {
        const characters = await prisma.characters.findMany({
            select: { name: true, level: true, hp: true, power: true, defense: true, speed: true, money: true },
        });

        return res.status(200).json({ data: characters });
    } catch (err) {
        next(err);
    }
});

// 캐릭터 상세조회
router.get('/api/character/:name', async (req, res, next) => {
    const { name } = req.params;

    // 스킨
    const skinId = await prisma.skins.findFirst({
        where: { name: name },
        select: { skinId: true },
    });

    const skinName = await prisma.skins.findFirst({
        where: { skinId: +skinId },
        select: { name: true },
    });

    // 캐릭터
    const character = await prisma.characters.findFirst({
        where: { name: name },
        select: { name: true, level: true, hp: true, power: true, defense: true, speed: true, money: true },
    });

    // 장착중인 장비
    const characterId = await prisma.characters.findFirst({
        where: { name: name },
        select: { characterId: true },
    });

    const item = await prisma.CharacterItems.findMany({
        where: { characterId: +characterId },
        select: {
            item: {
                select: {
                    name: true,
                    price: true,
                    iHp: true,
                    iPower: true,
                    iDefense: true,
                    iSpeed: true,
                    mountingLocation: true,
                },
            },
        },
    }); // 추가하기

    // 인벤토리
    const inventory = await prisma.CharacterItems.findMany({
        where: { characterId: +characterId },
        select: {
            itemCount: true,
            item: {
                select: {
                    name: true,
                    price: true,
                    iHp: true,
                    iPower: true,
                    iDefense: true,
                    iSpeed: true,
                    mountingLocation: true,
                },
            },
        },
    });

    return res.status(200).json({ skinName: skinName, character: character, equipped: item, inventory: inventory });
});

// 캐릭터 수정 <- 스킨, 이름만 변경
router.patch('/api/character/:characterId', async (req, res, next) => {
    try {
        const { characterId } = req.params;
        const { name, skinId } = req.body;

        // 아이템 존재 확인
        const skin = await prisma.skins.findUnique({ where: { skinId: +skinId } });
        if (!skin) return res.status(404).json({ message: '존재하지 않는 아이템입니다.' });

        const data = {
            ...(name.trim() && { name: name.trim() }),
            ...(skinId.trim() && { skinId: skinId.trim() }),
        };

        if (!Object.keys(data).length) {
            return res.status(400).json({ message: '수정할 데이터가 없습니다.' });
        }

        // 데이터베이스 업데이트
        const updatedcharacte = await prisma.charactes.update({
            where: { characterId: +characterId },
            data,
        });

        // 성공 응답
        return res.status(200).json({
            message: '캐릭터가 성공적으로 수정되었습니다.',
            data: updatedItem,
        });
        {
        }
    } catch (err) {
        next(err);
    }
});

// 캐릭터 삭제 API
router.delete('/api/character/:characterId', async (req, res, next) => {
    try {
        const { characterId } = req.params;
        const character = await prisma.characters.findUnique({ where: { characterId: +characterId } });

        // 캐릭터 존재 여부 확인
        if (!character) {
            return res.status(404).json({ message: '존재하지 않는 캐릭터입니다.' });
        }

        // 캐릭터 삭제
        await prisma.characters.delete({ where: { characterId: +characterId } });

        return res.status(200).json({ message: '캐릭터가 삭제되었습니다.' });
    } catch (err) {
        next(err);
    }
});

export default router;
