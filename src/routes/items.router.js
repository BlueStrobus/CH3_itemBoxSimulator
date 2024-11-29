import express from 'express';
import dotenv from 'dotenv';
import { prisma } from '../utils/prisma/index.js';

dotenv.config();
const router = express.Router();

// 스킨 생성
router.post('/api/skin', async (req, res, next) => {
    const { name, description, imgurl } = req.body;
    // 필수 입력값을 모두 받았는지 확인
    if (!description) {
        description = '신규 등록된 스킨입니다. 스킨설명을 추가하세요.';
    } else if (!name || !imgurl.trim().length === 0) {
        //공백 문자열을 무효화
        return res.status(400).json({
            error: '생성할 스킨의 이름과 이미지URL을 입력해 주세요.',
        });
    }

    const skin = await prisma.skins.create({
        data: {
            name,
            description,
            imgurl,
        },
    });

    return res.status(201).json({ data: skin });
});

// 스킨 전체 조회
router.get('/api/skin', async (req, res, next) => {
    const skins = await prisma.skins.findMany({
        select: {
            skinId: true,
            name: true,
            description: true,
            imgurl: true,
            created_at: true,
        },
    });

    return res.status(200).json({ data: skins });
});

// 스킨 상세 조회
router.get('/api/skin/:name', async (req, res, next) => {
    const { name } = req.params;
    const skin = await prisma.skins.findFirst({
        where: { name: name },
        select: {
            name: true,
            description: true,
            imgurl: true,
            created_at: true,
        },
    });

    return res.status(200).json({ data: skin });
});

// 스킨 수정
router.patch('/api/skin/:skinId', async (req, res) => {
    try {
        const { itemId } = req.params;
        const { name, description, price, iHp, iPower, iDefense, iSpeed, mountingLocation } = req.body;

        // 아이템 존재 확인
        const item = await prisma.items.findUnique({ where: { itemId: +itemId } });
        if (!item) return res.status(404).json({ message: '존재하지 않는 아이템입니다.' });

        const data = {
            ...(name?.trim() && { name: name.trim() }),
            ...(description?.trim() && { description: description.trim() }),
            ...(price >= 0 && Number.isInteger(price) && { price }),
            ...(Number.isInteger(iHp) && { iHp }),
            ...(Number.isInteger(iPower) && { iPower }),
            ...(Number.isInteger(iDefense) && { iDefense }),
            ...(Number.isInteger(iSpeed) && { iSpeed }),
            ...(mountingLocation?.trim() && { mountingLocation: mountingLocation.trim() }),
        };

        if (!Object.keys(data).length) {
            return res.status(400).json({ message: '수정할 데이터가 없습니다.' });
        }

        // 데이터베이스 업데이트
        const updatedItem = await prisma.items.update({
            where: { itemId: +itemId },
            data,
        });

        // 성공 응답
        return res.status(200).json({
            message: '아이템이 성공적으로 수정되었습니다.',
            data: updatedItem,
        });
        {
        }
    } catch (err) {
        next(err);
    }
});

// 스킨 삭제
router.delete('/api/skin/:skinId', async (req, res, next) => {
    try {
        const { itemId } = req.params;
        const item = await prisma.items.findUnique({ where: { itemId: +itemId } });

        // 아이템 존재 여부 확인
        if (!item) {
            return res.status(404).json({ message: '존재하지 않는 아이템입니다.' });
        }

        // 아이템 삭제
        await prisma.items.delete({ where: { itemId: +itemId } });

        return res.status(200).json({ message: '아이템이 삭제되었습니다.' });
    } catch (err) {
        next(err);
    }
});
//  스킨
/////////////////////////////////
// 아이템
// 지정
// name, description, price, iHp, iPower, iDefense , iSpeed, mountingLocation
// 디폴트, 자동생성
// itemId, updatedAt, createdAt

// 아이템 생성
router.post('/api/item', async (req, res, next) => {
    try {
        const { name, description, price, iHp, iPower, iDefense, iSpeed, mountingLocation } = req.body;

        // name, description, price, iHp, iPower, iDefense , iSpeed, mountingLocation
        if (!name.trim().length === 0) {
            return res.status(400).json({ message: '아이템의 이름을 입력해 주세요.' });
        }

        const mountingLocationArr = ['모자', '갑옷', '바지', '로브'];
        if (!mountingLocationArr.includes(value)) {
            return res.status(400).json({ message: "아이템의 장착 위치는 '모자', '갑옷', '바지', '로브' 중 하나여야 합니다." });
        }

        if (price < 100) {
            return res.status(400).json({ message: '아이템의 가격은 100 이상이어야 합니다.' });
        }

        // 대상 변수
        let attributes = { iHp, iPower, iDefense, iSpeed };

        // null 값 검사 후 0 할당
        for (let key in attributes) {
            if (attributes[key] === null) {
                attributes[key] = 0; // null인 경우 0 할당
            }
        }

        // 정수가 아닌 값 검사
        for (let key in attributes) {
            if (!Number.isInteger(attributes[key])) {
                return res.status(400).json({ message: '아이템의 가격과 능력치는 정수를 입력해 주세요.' });
            }
        }

        if (!description) {
            description = '신규 등록된 아이템 입니다. 스킨설명을 추가하세요.';
        }

        const item = await prisma.items.create({
            data: { name, description, price, iHp, iPower, iDefense, iSpeed, mountingLocation },
        });

        return res.status(201).json({ data: item });
    } catch (err) {
        next(err);
    }
});

// 아이템
// name, description, price, iHp, iPower, iDefense , iSpeed, mountingLocation,itemId, updatedAt, createdAt
// 아이템 전체 조회
router.get('/api/items', async (req, res, next) => {
    const items = await prisma.items.findMany({
        select: {
            name: true,
            description: true,
            price: true,
            iHp: true,
            iPower: true,
            iDefense: true,
            iSpeed: true,
            mountingLocation: true,
            itemId: true,
            updatedAt: true,
            createdAt: true,
        },
    });

    return res.status(200).json({ data: items });
});

// 아이템 상세 조회
router.get('/api/item/:name', async (req, res, next) => {
    try {
        // 요청 파라미터 검증
        const { name } = req.params;
        if (!name || typeof name !== 'string' || name.trim().length === 0) {
            return res.status(400).json({ message: '유효하지 않은 아이템 이름입니다.' });
        }

        // 데이터베이스에서 아이템 검색
        const item = await prisma.items.findFirst({
            where: { name: name },
            select: {
                name: true,
                description: true,
                price: true,
                iHp: true,
                iPower: true,
                iDefense: true,
                iSpeed: true,
                mountingLocation: true,
                itemId: true,
                updatedAt: true,
                createdAt: true,
            },
        });

        // 아이템이 존재하지 않을 경우
        if (!item) {
            return res.status(404).json({ message: '존재하지 않는 아이템 이름입니다.' });
        }

        // 성공 응답
        return res.status(200).json({ data: item });
    } catch (err) {
        next(err);
    }
});

// 아이템
// name, description, price, iHp, iPower, iDefense , iSpeed, mountingLocation,itemId, updatedAt, createdAt

// 아이템 수정
router.patch('/api/item/:itemId', async (req, res, next) => {
    try {
        const { itemId } = req.params;
        const { name, description, price, iHp, iPower, iDefense, iSpeed, mountingLocation } = req.body;

        // 아이템 존재 확인
        const item = await prisma.items.findUnique({ where: { itemId: +itemId } });
        if (!item) return res.status(404).json({ message: '존재하지 않는 아이템입니다.' });

        // 업데이트할 데이터 필터링
        /*...() 구문은 다음과 같은 역할을 합니다:

조건부 객체 생성: 각 조건이 true일 때만 해당 속성을 data 객체에 추가합니다.
조건 평가 후 객체 반환:
name?.trim()이 참이면 { name: name.trim() } 객체를 반환하고, false이면 false를 반환합니다.
&& 연산자가 false인 경우 해당 객체는 무시되므로, 실제로 data 객체에 해당 속성이 포함되지 않게 됩니다.*/
        const data = {
            ...(name?.trim() && { name: name.trim() }),
            ...(description?.trim() && { description: description.trim() }),
            ...(price >= 0 && Number.isInteger(price) && { price }),
            ...(Number.isInteger(iHp) && { iHp }),
            ...(Number.isInteger(iPower) && { iPower }),
            ...(Number.isInteger(iDefense) && { iDefense }),
            ...(Number.isInteger(iSpeed) && { iSpeed }),
            ...(mountingLocation?.trim() && { mountingLocation: mountingLocation.trim() }),
        };

        if (!Object.keys(data).length) {
            return res.status(400).json({ message: '수정할 데이터가 없습니다.' });
        }

        // 데이터베이스 업데이트
        const updatedItem = await prisma.items.update({
            where: { itemId: +itemId },
            data,
        });

        // 성공 응답
        return res.status(200).json({
            message: '아이템이 성공적으로 수정되었습니다.',
            data: updatedItem,
        });
        {
        }
    } catch (err) {
        next(err);
    }
});

// 아이템 삭제
router.delete('/api/item/:itemId', async (req, res, next) => {
    try {
        const { itemId } = req.params;
        const item = await prisma.items.findUnique({ where: { itemId: +itemId } });

        // 아이템 존재 여부 확인
        if (!item) {
            return res.status(404).json({ message: '존재하지 않는 아이템입니다.' });
        }

        // 아이템 삭제
        await prisma.items.delete({ where: { itemId: +itemId } });

        return res.status(200).json({ message: '아이템이 삭제되었습니다.' });
    } catch (err) {
        next(err);
    }
});

export default router;
