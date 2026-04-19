import { PrismaPg } from '@prisma/adapter-pg';
import {
  AlertSeverity,
  DeviceStatus,
  PrismaClient,
  RecommendationType,
  Role,
} from '@prisma/client';
import { hash } from 'bcryptjs';

const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    'DIRECT_URL or DATABASE_URL must be set before running prisma:seed',
  );
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

function buildTelemetry(index: number, deviceIndex: number) {
  const baseTemperature = 22 + deviceIndex * 4;
  const anomaly = index % 17 === 0;

  return {
    temperature: anomaly ? baseTemperature + 17 : baseTemperature + (index % 5),
    humidity: anomaly ? 18 + (index % 3) : 45 + (index % 20),
    light: 220 + index * 9 + deviceIndex * 15,
    anomaly,
  };
}

async function main() {
  await prisma.alert.deleteMany();
  await prisma.recommendation.deleteMany();
  await prisma.telemetry.deleteMany();
  await prisma.device.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await hash('Admin@12345', 10);
  const userPasswordHash = await hash('Farmer@12345', 10);

  const admin = await prisma.user.create({
    data: {
      fullName: 'System Admin',
      email: 'admin@agri.com',
      passwordHash,
      role: Role.ADMIN,
    },
  });

  const user = await prisma.user.create({
    data: {
      fullName: 'Ahmed Ben Ali',
      email: 'user@agri.com',
      passwordHash: userPasswordHash,
      role: Role.USER,
    },
  });

  const devices = await Promise.all([
    prisma.device.create({
      data: {
        name: 'Olive Grove Sensor',
        location: 'Sfax',
        soilType: 'loam',
        cropType: 'olive',
        status: DeviceStatus.ONLINE,
        ownerId: user.id,
      },
    }),
    prisma.device.create({
      data: {
        name: 'Tomato Field Node',
        location: 'Nabeul',
        soilType: 'sandy loam',
        cropType: 'tomato',
        status: DeviceStatus.ONLINE,
        ownerId: user.id,
      },
    }),
    prisma.device.create({
      data: {
        name: 'Admin Demo Station',
        location: 'Tunis',
        soilType: 'clay loam',
        cropType: 'citrus',
        status: DeviceStatus.MAINTENANCE,
        ownerId: admin.id,
      },
    }),
  ]);

  const telemetrySeeds = devices.flatMap((device, deviceIndex) =>
    Array.from({ length: 40 }, (_, index) => ({
      deviceId: device.id,
      ...buildTelemetry(index, deviceIndex),
      timestamp: new Date(Date.now() - (40 - index) * 15 * 60 * 1000),
    })),
  );

  await prisma.telemetry.createMany({ data: telemetrySeeds });

  const latestByDevice = await Promise.all(
    devices.map((device) =>
      prisma.telemetry.findFirst({
        where: { deviceId: device.id },
        orderBy: { timestamp: 'desc' },
      }),
    ),
  );

  for (const [index, device] of devices.entries()) {
    const latest = latestByDevice[index];
    if (!latest) continue;

    const recommendationTemplates = [
      {
        type: RecommendationType.CROP_HEALTH,
        title:
          latest.temperature > 38
            ? 'Heat stress detected'
            : 'Crop vitality stable',
        explanation:
          latest.temperature > 38
            ? 'Use shade and irrigation support to protect the canopy.'
            : 'Current crop condition is healthy and stable.',
        reason:
          latest.temperature > 38
            ? 'Temperature exceeds the crop comfort threshold.'
            : 'Temperature and humidity remain within expected range.',
        detectedIssues: latest.temperature > 38 ? ['heat_stress'] : [],
        confidence: latest.temperature > 38 ? 92 : 78,
      },
      {
        type: RecommendationType.IRRIGATION,
        title:
          latest.humidity < 35
            ? 'Increase irrigation'
            : 'Maintain current watering',
        explanation:
          latest.humidity < 35
            ? 'Moisture is below the desired threshold for active growth.'
            : 'Watering rhythm is aligned with current humidity.',
        reason:
          latest.humidity < 35
            ? 'Humidity trend indicates a short-term water stress risk.'
            : 'No moisture deficit has been detected recently.',
        detectedIssues: latest.humidity < 35 ? ['low_humidity'] : [],
        confidence: latest.humidity < 35 ? 87 : 71,
      },
      {
        type: RecommendationType.FERTILIZER,
        title: 'Use balanced nutrient plan',
        explanation:
          'Split fertilizer applications around irrigation cycles to improve absorption.',
        reason:
          'Nutrient uptake improves with split doses and stable irrigation.',
        detectedIssues: [],
        confidence: 74,
      },
      {
        type: RecommendationType.BEST_CROP,
        title: 'Consider drought tolerant crops',
        explanation:
          'Olive, sorghum and chickpea match the current climate profile well.',
        reason:
          'Current heat and moisture conditions favor resilient varieties.',
        detectedIssues: latest.anomaly ? ['climate_volatility'] : [],
        confidence: 81,
      },
    ];

    await prisma.recommendation.createMany({
      data: recommendationTemplates.map((recommendation) => ({
        deviceId: device.id,
        type: recommendation.type,
        title: recommendation.title,
        explanation: recommendation.explanation,
        reason: recommendation.reason,
        detectedIssues: recommendation.detectedIssues,
        confidence: recommendation.confidence,
      })),
    });

    if (latest.anomaly) {
      await prisma.alert.create({
        data: {
          deviceId: device.id,
          userId: device.ownerId,
          severity:
            latest.temperature > 42
              ? AlertSeverity.CRITICAL
              : AlertSeverity.HIGH,
          title: 'Seed anomaly detected',
          message: 'Seeded telemetry indicates abnormal field conditions.',
        },
      });
    }
  }

  console.log('Seed completed.');
  console.log('Demo admin: admin@agri.com / Admin@12345');
  console.log('Demo user: user@agri.com / Farmer@12345');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
