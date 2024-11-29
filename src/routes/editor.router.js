// editor.router.js
import express from 'express';
import dotenv from 'dotenv';
import { prisma } from '../utils/prisma/index.js';

dotenv.config();
const router = express.Router();

// id, 이름 조회

// 아이템
router.get('/editer/items', async (req, res, next) => {
    try {
        const items = await prisma.items.findMany({
            select: { itemid: true, name: true },
        });

        return res.status(200).json({ data: items });
    } catch (err) {
        next(err);
    }
});

// 스킨
router.get('/editer/skins', async (req, res, next) => {
    try {
        const skins = await prisma.skins.findMany({
            select: { skinid: true, name: true },
        });

        return res.status(200).json({ data: skins });
    } catch (err) {
        next(err);
    }
});

// 캐릭터
router.get('/editer/charcters', async (req, res, next) => {
    try {
        const charcters = await prisma.charcters.findMany({
            select: { charcterid: true, name: true },
        });

        return res.status(200).json({ data: charcters });
    } catch (err) {
        next(err);
    }
});

// 전체 조회

// 아이템
router.get('/editer/all/items', async (req, res, next) => {
    try {
        const items = await prisma.items.findMany({
            select: { itemId: true, name: true, description: true, price: true, iHp: true, iPower: true, iDefense: true, iSpeed: true, mountingLocation: true, updatedAt: true, createdAt: true },
        });

        return res.status(200).json({ data: items });
    } catch (err) {
        next(err);
    }
});

// 스킨
router.get('/editer/all/skins', async (req, res, next) => {
    try {
        const skins = await prisma.skins.findMany({
            select: { skinId: true, name: true, description: true, imgurl: true, updatedAt: true, createdAt: true },
        });

        return res.status(200).json({ data: skins });
    } catch (err) {
        next(err);
    }
});

// 캐릭터
router.get('/api/character', async (req, res, next) => {
    try {
        const characters = await prisma.characters.findMany({
            select: { charcterId: true, skinId: true, name: true, level: true, hp: true, power: true, defense: true, speed: true, money: true, updatedAt: true, createdAt: true },
        });

        return res.status(200).json({ data: characters });
    } catch (err) {
        next(err);
    }
});

export default router;
