📦 AgentCredit — Guía Completa de Integración

Monad TrainSync Hackathon | Dev1 — Contratos Inteligentes


🧠 Contexto — Qué es este contrato y por qué existe
Monad TrainSync es un sistema donde GPUs distribuidas (Workers) reciben lotes de datos
de entrenamiento de IA pagando micro-pagos en tiempo real usando el protocolo x402 sobre
Monad Testnet.
El problema que resuelve AgentCredit.sol:
El sistema necesitaba un árbitro on-chain — algo que viviera en la blockchain y que nadie
pudiera manipular — que cumpliera tres funciones:

Registrar qué Workers están autorizados a participar
Acreditar reputación cada vez que un Worker paga correctamente y recibe datos
Penalizar Workers que se comporten de forma corrupta o inválida

Todo queda grabado en Monad de forma pública, inmutable y auditable en tiempo real.
Los jueces pueden verlo en el explorador. Nadie puede falsificarlo.

🔗 Datos del Contrato Desplegado
CampoValorContract Address0x362ECBdeDfDaEfE91dBe75d4eE3f212C2DDdfc8COwner (Servidor)0xD92f557b538d5Cf5fd680698f9062254E5689A0DChain ID10143RedMonad TestnetRPC URLhttps://testnet-rpc.monad.xyzBloque de deploy32187212TX de creación0x5c1faa516fe4f40c6ae5510dd7f217ad4a568d8bace2421734b4f0bea12792a4Exploradorhttps://testnet.monadexplorer.com/address/0x362ECBdeDfDaEfE91dBe75d4eE3f212C2DDdfc8CCompiladorSolidity 0.8.24OptimizaciónSí, 200 runsVerificado✅ Partido completo (Sourcify)

🛡️ Seguridad implementada
El contrato no es solo código que funciona — está protegido contra los ataques más comunes:
ProtecciónDescripciónSolo OwnerÚnicamente el servidor orquestador puede registrar workers o dar créditoAnti-doble-pagoCada txPaymentHash x402 solo se acepta una vez. Si se repite, revierteCircuit breakerEl owner puede pausar todo el contrato con setPaused(true) si algo fallaSin underflowLa penalización nunca lleva el score a negativo, descuenta hasta 0 como maxCEI PatternChecks → Effects → Interactions en todas las funciones de escrituraOverflow nativoSolidity 0.8.24 protege contra overflow sin necesidad de SafeMath

📊 Constantes de Scoring
SCORE_PER_CHUNK   = 10 puntos  →  por cada lote de datos entregado
SCORE_PER_PAYMENT =  5 puntos  →  por cada pago x402 confirmado
PENALTY_CORRUPT   = 50 puntos  →  penalización por comportamiento inválido
Ejemplo: un Worker que entrega 1 chunk en un ciclo recibe 15 puntos (10 + 5).

📋 ABI Completo
json[
  {
    "type": "constructor",
    "inputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "registerWorker",
    "inputs": [{ "name": "worker", "type": "address" }],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "addCredit",
    "inputs": [
      { "name": "worker",          "type": "address" },
      { "name": "chunksDelivered", "type": "uint256" },
      { "name": "txPaymentHash",   "type": "bytes32" }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "penalizeWorker",
    "inputs": [{ "name": "worker", "type": "address" }],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "setPaused",
    "inputs": [{ "name": "_paused", "type": "bool" }],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "transferOwnership",
    "inputs": [{ "name": "newOwner", "type": "address" }],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "getLeaderboard",
    "inputs": [],
    "outputs": [
      { "name": "addrs",           "type": "address[]" },
      { "name": "scores",          "type": "uint256[]" },
      { "name": "chunksProcessed", "type": "uint256[]" },
      { "name": "payments",        "type": "uint256[]" }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getWorkerStats",
    "inputs": [{ "name": "worker", "type": "address" }],
    "outputs": [
      {
        "name": "",
        "type": "tuple",
        "components": [
          { "name": "score",               "type": "uint256" },
          { "name": "totalDataProcessed",  "type": "uint256" },
          { "name": "totalPayments",       "type": "uint256" },
          { "name": "lastActiveBlock",     "type": "uint256" },
          { "name": "isRegistered",        "type": "bool"    }
        ]
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getGlobalStats",
    "inputs": [],
    "outputs": [
      { "name": "_totalWorkers",      "type": "uint256" },
      { "name": "_totalTransactions", "type": "uint256" }
    ],
    "stateMutability": "view"
  },
  {
    "type": "event",
    "name": "WorkerRegistered",
    "inputs": [
      { "name": "worker",    "type": "address", "indexed": true  },
      { "name": "timestamp", "type": "uint256", "indexed": false }
    ]
  },
  {
    "type": "event",
    "name": "CreditAdded",
    "inputs": [
      { "name": "worker",          "type": "address", "indexed": true  },
      { "name": "scoreAdded",      "type": "uint256", "indexed": false },
      { "name": "newScore",        "type": "uint256", "indexed": false },
      { "name": "chunksProcessed", "type": "uint256", "indexed": false },
      { "name": "txPaymentHash",   "type": "bytes32", "indexed": false }
    ]
  },
  {
    "type": "event",
    "name": "WorkerPenalized",
    "inputs": [
      { "name": "worker",   "type": "address", "indexed": true  },
      { "name": "scoreLost","type": "uint256", "indexed": false },
      { "name": "newScore", "type": "uint256", "indexed": false }
    ]
  }
]

⚙️ Dev2 — Servidor Node.js + TypeScript + Viem
Configuración inicial
typescriptimport { createPublicClient, createWalletClient, http } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'

// Monad Testnet no está en el registry por defecto de Viem — definirlo manual
const monadTestnet = {
  id: 10143,
  name: 'Monad Testnet',
  network: 'monad-testnet',
  nativeCurrency: { name: 'MON', symbol: 'MON', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://testnet-rpc.monad.xyz'] },
  },
}

const CONTRACT_ADDRESS = '0x362ECBdeDfDaEfE91dBe75d4eE3f212C2DDdfc8C' as const

// IMPORTANTE: debe ser la misma private key con la que se deployó el contrato
// El contrato solo acepta llamadas del owner (esa wallet)
const account = privateKeyToAccount(process.env.PRIVATE_KEY as `0x${string}`)

// Cliente para leer (no firma)
const publicClient = createPublicClient({
  chain: monadTestnet,
  transport: http(),
})

// Cliente para escribir (firma con la private key del owner)
const walletClient = createWalletClient({
  chain: monadTestnet,
  transport: http(),
  account,
})
Registrar un Worker nuevo
typescript// Llamar UNA SOLA VEZ por worker nuevo
// Si el worker ya existe, la función no falla (es idempotente)
const txHash = await walletClient.writeContract({
  address: CONTRACT_ADDRESS,
  abi: ABI,
  functionName: 'registerWorker',
  args: [workerAddress as `0x${string}`],
})

console.log('Worker registrado. TX:', txHash)
Acreditar Worker tras validar pago x402 ⭐ (llamada principal del ciclo)
typescript// Esto se llama DESPUÉS de:
// 1. Recibir la petición del worker con header X-Payment: [txHash]
// 2. Verificar que la TX de pago está confirmada en Monad RPC
// 3. Liberar el batch de datos al worker en la respuesta HTTP

const txHash = await walletClient.writeContract({
  address: CONTRACT_ADDRESS,
  abi: ABI,
  functionName: 'addCredit',
  args: [
    workerAddress as `0x${string}`,  // dirección del GPU Worker
    1n,                               // chunks entregados (normalmente 1 por ciclo)
    paymentTxHash as `0x${string}`    // hash del pago x402 en Monad
  ],
})

// IMPORTANTE: si el mismo paymentTxHash se envía dos veces,
// el contrato revierte con "AgentCredit: already processed"
// Esto protege contra bugs de doble acreditación en el servidor
Penalizar Worker corrupto
typescriptawait walletClient.writeContract({
  address: CONTRACT_ADDRESS,
  abi: ABI,
  functionName: 'penalizeWorker',
  args: [workerAddress as `0x${string}`],
})
Leer leaderboard (para emitir por WebSocket al frontend)
typescriptconst [addrs, scores, chunks, payments] = await publicClient.readContract({
  address: CONTRACT_ADDRESS,
  abi: ABI,
  functionName: 'getLeaderboard',
}) as [string[], bigint[], bigint[], bigint[]]

const leaderboard = addrs.map((addr, i) => ({
  address:         addr,
  score:           Number(scores[i]),
  chunksProcessed: Number(chunks[i]),
  payments:        Number(payments[i]),
})).sort((a, b) => b.score - a.score)

io.emit('leaderboard:update', leaderboard)
Leer stats globales
typescriptconst [totalWorkers, totalTransactions] = await publicClient.readContract({
  address: CONTRACT_ADDRESS,
  abi: ABI,
  functionName: 'getGlobalStats',
}) as [bigint, bigint]

io.emit('stats:update', {
  totalWorkers:      Number(totalWorkers),
  totalTransactions: Number(totalTransactions),
})
Pausar en emergencia
typescriptawait walletClient.writeContract({
  address: CONTRACT_ADDRESS,
  abi: ABI,
  functionName: 'setPaused',
  args: [true],
})

🎨 Dev3 — Frontend React + TailwindCSS
Configuración del cliente público
typescriptimport { createPublicClient, http } from 'viem'

const monadTestnet = {
  id: 10143,
  name: 'Monad Testnet',
  nativeCurrency: { name: 'MON', symbol: 'MON', decimals: 18 },
  rpcUrls: { default: { http: ['https://testnet-rpc.monad.xyz'] } },
}

const publicClient = createPublicClient({
  chain: monadTestnet,
  transport: http(),
})

const CONTRACT_ADDRESS = '0x362ECBdeDfDaEfE91dBe75d4eE3f212C2DDdfc8C' as const
Escuchar evento CreditAdded en tiempo real ⭐
typescript// Este evento se emite cada vez que un Worker recibe crédito
// Úsalo para actualizar el leaderboard sin polling

useEffect(() => {
  const unwatch = publicClient.watchContractEvent({
    address: CONTRACT_ADDRESS,
    abi: ABI,
    eventName: 'CreditAdded',
    onLogs: (logs) => {
      logs.forEach(log => {
        console.log('Nuevo crédito:', {
          worker:        log.args.worker,
          scoreAdded:    log.args.scoreAdded?.toString(),
          newScore:      log.args.newScore?.toString(),
          txPaymentHash: log.args.txPaymentHash,
        })
        refetchLeaderboard()
      })
    }
  })

  return () => unwatch()
}, [])
Leer leaderboard
typescriptconst fetchLeaderboard = async () => {
  const [addrs, scores, chunks, payments] = await publicClient.readContract({
    address: CONTRACT_ADDRESS,
    abi: ABI,
    functionName: 'getLeaderboard',
  }) as [string[], bigint[], bigint[], bigint[]]

  return addrs.map((addr, i) => ({
    address:         addr,
    score:           Number(scores[i]),
    chunksProcessed: Number(chunks[i]),
    payments:        Number(payments[i]),
  })).sort((a, b) => b.score - a.score)
}
Leer stats globales
typescriptconst fetchGlobalStats = async () => {
  const [totalWorkers, totalTransactions] = await publicClient.readContract({
    address: CONTRACT_ADDRESS,
    abi: ABI,
    functionName: 'getGlobalStats',
  }) as [bigint, bigint]

  return {
    totalWorkers:      Number(totalWorkers),
    totalTransactions: Number(totalTransactions),
  }
}

🐍 Dev4 — Python Worker + Web3.py
Instalación
bashpip install web3 python-dotenv
Configuración
pythonfrom web3 import Web3
from dotenv import load_dotenv
import json, os

load_dotenv()

RPC_URL          = "https://testnet-rpc.monad.xyz"
CONTRACT_ADDRESS = "0x362ECBdeDfDaEfE91dBe75d4eE3f212C2DDdfc8C"
PRIVATE_KEY      = os.getenv("PRIVATE_KEY")

w3 = Web3(Web3.HTTPProvider(RPC_URL))

ABI      = json.loads(open("abi.json").read())
contract = w3.eth.contract(
    address=Web3.to_checksum_address(CONTRACT_ADDRESS),
    abi=ABI
)
account  = w3.eth.account.from_key(PRIVATE_KEY)
Leer stats de un Worker
pythonstats = contract.functions.getWorkerStats(account.address).call()

print(f"Score:            {stats[0]}")
print(f"Chunks procesados:{stats[1]}")
print(f"Pagos totales:    {stats[2]}")
print(f"Último bloque:    {stats[3]}")
print(f"Registrado:       {stats[4]}")
Escuchar eventos CreditAdded
pythonimport time

event_filter = contract.events.CreditAdded.create_filter(from_block='latest')

while True:
    for event in event_filter.get_new_entries():
        if event['args']['worker'].lower() == account.address.lower():
            print(f"✅ Crédito recibido: +{event['args']['scoreAdded']} puntos")
            print(f"   Score actual: {event['args']['newScore']}")
    time.sleep(1)

🔄 Flujo completo del protocolo x402
Worker                    Servidor                   Contrato (Monad)
  │                          │                              │
  │── GET /api/training-data ─>│                              │
  │                          │                              │
  │<── 402 Payment Required ──│                              │
  │    { amount, wallet }     │                              │
  │                          │                              │
  │── [firma TX en Monad] ─────────────────────────────────>│
  │                          │                        [TX confirmada]
  │                          │                              │
  │── GET /api/training-data ─>│                              │
  │   X-Payment: [txHash]    │                              │
  │                          │── verifica TX en RPC ────────>│
  │                          │<── TX válida ─────────────────│
  │                          │                              │
  │                          │── addCredit(worker,1,txHash) ─>│
  │                          │                        [score += 15]
  │                          │                        [emit CreditAdded]
  │<── 200 + datos batch ─────│                              │
  │                          │                              │
  │── [simula entrenamiento] │                              │
  │── [repite ciclo] ─────────>│                              │

⚠️ Reglas críticas para todos los devs
ReglaConsecuencia si se ignoraEl servidor DEBE usar la misma private key del deployLas llamadas revertirán con "not owner"Cada txPaymentHash es de un solo usoSi se repite, revierte con "already processed"Registrar el worker ANTES de acreditarloSi no está registrado, revierte con "not registered"Convertir bigint a Number en el frontendLos valores del contrato vienen como bigint en JSEl contrato puede estar pausadoVerificar paused() si las llamadas empiezan a revertir

🧪 Tests del contrato
12 tests + fuzz testing antes del deploy. Todos en verde:
TestQué verificatest_RegisterWorkerRegistro básico de un workertest_RegisterWorkerIdempotentRegistrar dos veces no falla ni duplicatest_AddCreditAcreditación correcta con score esperadotest_PenalizePenalización descuenta correctamentetest_LeaderboardRetorna todos los workers con sus statstest_DuplicatePaymentRevertsMismo hash revierte en segundo intentotest_UnregisteredWorkerRevertsWorker no registrado no puede recibir créditotest_PenalizeNoUnderflowScore nunca va a negativotest_PausedRevertsContrato pausado rechaza operacionestest_OnlyOwnerCanCreditWallet no-owner no puede llamar addCredittest_TransferOwnershipCambio de owner funciona correctamentetestFuzz_ScoreGrowsLinear256 inputs aleatorios, score siempre correcto

🛠️ Stack usado por Dev1
HerramientaUsoSolidity 0.8.24Lenguaje del contrato inteligenteFoundryEntorno completo: compilar, testear, deployarforge buildCompilación con detección de erroresforge test -vvv12 tests + fuzz test automáticoforge script --broadcastDeploy real a Monad Testnetforge verify-contractPublicar código fuente en el exploradorSourcifyServicio de verificación compatible con MonadMonad TestnetBlockchain de deploy — Chain 10143, 10k TPS, <1 segMetaMaskWallet para firmar transacciones realesPowerShellTerminal Windows para correr todos los comandos

Dev1 — Contratos Inteligentes | Monad TrainSync Hackathon
Contrato desplegado y verificado el 16 de mayo de 2026