'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
interface PacienteEnEspera {
  id: string | number;
  nombre_paciente?: string;
  nombre?: string;
  dni_paciente?: string;
  dni?: string;
  edad?: string | number;
  talla?: string | number;
  peso?: string | number;
  imc?: string | number;
  temperatura?: string | number;
  presion_arterial?: string;
  presion?: string;
  pulso?: string | number;
  frecuencia_cardiaca?: string | number;
  frecuencia_respiratoria?: string;
  so2?: string | number;
  hb?: string | number;
  glucosa?: string;
  examenes_solicitados?: string;
  antecedentes?: string;
  observaciones?: string;
  observaciones_triaje?: string;
  fecha?: string;
  hora?: string;
}
interface ConsultaGuardada {
  id: string | number;
  dni_paciente: string;
  fecha: string;
  motivo: string;
  diagnostico: string;
  receta: string;
  dieta?: string;
  imagen_url?: string;
}
interface AdjuntoConsulta { id: number; nombre: string; tipo: string; fecha: string }
const DIETAS_VITAL_SALUD = [
  {
    nombre: '🚫 DIABETES',
    contenido: `CENTRO DE REHABILITACIÓN NATURAL VITAL SALUD SAC - DIABETES
6:00 am. En ayunas tomar un vaso de agua tibia 250 ml más un limón y una cucharita de bicarbonato de sodio. Agregar 2 vasos de agua.
6:30 am. Tomar 30 ml de jugo cítrico más 1 sobre de Immunocal regular azul más 1 sobre Immunocal optimizer, después de 3 días agregar 1 sobre de Inmunocal platinum.
8:00 am. Desayuno: Ensalada de vegetales más 1 cda germen de trigo y 1 cda de salvado de trigo más un cereal: quinua, trigo, avena, más 6 almendras o 4 nueces o 1 cda de semillas de girasol. Tomar 5 cápsulas de espirulina más las cápsulas de la parte inferior. Masticar bien, comer contento y sin distracciones.
10:00 am. Mate tibio: Tomar 1/2 litro de mate tibio de pasuchaca, cutí cutí, sin azúcar.
11:00 am. Tomar un vaso de zumo de perejil, berro, espinaca o acelga más extracto de zanahoria y apio. Tomar tibio.
12:00 m. Tomar 30 ml de jugo cítrico más 1 sobre de Immunocal regular azul más 1 sobre Immunocal optimizer, después de 3 días agregar 1 sobre de Inmunocal platinum.
1:00 pm. Almuerzo: Ensalada de vegetales crudos y un segundo vegetariano. Poca sal de maras o marina (Consumir 2 veces por semana menestras como lentejas o frijol negro o rojo previamente remojada, dándole un hervor y votando el agua). Tomar 5 cápsulas de espirulina más las cápsulas de la parte inferior. Masticar bien.
3:00 pm. Tomar 1/2 litro de mate tibio de la anterior preparación.
5:00 pm. Tomar un vaso de zumo de perejil, berro, espinaca o acelga más extracto de zanahoria y apio. Tomar tibio.
6:00 pm. Cena: Similar al desayuno. Más 3 cápsulas de espirulina más las cápsulas de la parte inferior.
8:00 pm. Tomar 30 ml de jugo cítrico más 1 sobre de Immunocal regular azul más 1 sobre Immunocal optimizer, después de 3 días agregar 1 sobre de Inmunocal platinum.
RECOMENDACIONES:
- NO COMER NADA APARTE DE LO INDICADO. Si tiene sed tome agua tibia. Tener en cuenta sus evacuaciones.
- Nota: La alimentación debe ser 70% crudo y 30% cocinado.
- Hábitos saludables: comer a su hora, masticar bien, tomar agua 30 minutos antes y 2 horas después de las comidas, equilibrio físico y emocional, ejercicio físico 30 minutos de 3 a 4 veces por semana, dormir antes de las 10 pm.
- Geoterapia: Colocar en la parte abdominal en cuerpo caliente emplasto de barro o sábila y mantener el cuerpo caliente, 2 veces al día (pies calientes).
- Hidroterapia: baño de asiento, baño de vapor, fricciones de agua fría (pies calientes).
- NO COMER: Grasas saturadas, frituras, embutidos, quesos, carnes rojas, pescado, pollo, tocino, manteca, margarina, rehogados con aceite, helados.
- NO TOMAR: Bebidas azucaradas, café, té, gaseosas, chocolate, dulces, etc.
--------------------------------------------------
CÁPSULAS ADICIONALES (Tomar después del D/A/C):
--------------------------------------------------
- _____________________________________________
- _____________________________________________
- _____________________________________________
- _____________________________________________`
  },
  {
    nombre: '🟡 CÁLCULOS BILIARES (7 DÍAS)',
    contenido: `CENTRO DE REHABILITACIÓN NATURAL VITAL SALUD SAC - CÁLCULOS BILIARES (7 DÍAS)
6:00 am: Fricción de agua fría por todo el cuerpo (pies calientes).
6:10 am: Tomar 1 vaso de agua de lechuga (hervir una lechuga entera por 15 minutos en un litro de agua), tomar la mitad en la mañana y la otra mitad en la noche.
6:20 am: Tomar 2 cucharadas de aceite de oliva más el zumo de un limón.
6:30 am: Tomar 30 ml de jugo cítrico más 1 sobre de Immunocal regular azul más 1 sobre Immunocal optimizer, después de 3 días agregar 1 sobre de Inmunocal platinum.
6:45 am: Tomar mate tibio de 3 plantas (diente de león, chanca piedra, flor blanca, manayupa, carqueja) (tomar 2 vasos).
8:00 am: Desayuno: consumir medio litro de extracto de manzana y 5 cápsulas de espirulina más las cápsulas de la parte inferior.
10:00 am: Extracto de apio, zanahoria, betarraga (200 ml).
12:00 m: Tomar mate de 3 plantas (diente de león, chanca piedra, flor blanca, manayupa, carqueja) (tomar 2 vasos).
12:30 pm: Tomar 2 cucharadas de aceite de oliva más el zumo de un limón.
1:00 pm: Almuerzo: consumir medio litro de extracto de manzana y 5 cápsulas de espirulina más las cápsulas de la parte inferior.
3:00 pm: Tomar mate de 3 plantas (diente de león, chanca piedra, flor blanca, manayupa, carqueja) (tomar 2 vasos).
5:00 pm: Tomar medio litro de extracto de piña o papaya.
6:00 pm: Cena: consumir un plato de manzanas (1/2 kilo).
7:30 pm: Tomar mate de 3 plantas (diente de león, chanca piedra, flor blanca, manayupa, carqueja) (tomar 2 vasos).
8:00 pm: Tomar 2 cucharadas de aceite de oliva más el zumo de un limón.
8:30 pm: Tomar 1 vaso de agua de lechuga, tomar la mitad.
9:00 pm: Tomar 30 ml de jugo cítrico más 1 sobre de Immunocal regular azul más 1 sobre Immunocal optimizer.
NOTAS Y RECOMENDACIONES:
- Después de 2 días reemplazar desayuno, almuerzo y cena con fruta fresca variada y ensaladas sin sal con aceite de oliva.
- Tomar 30 gotas de aceite de copaiba después de desayuno, almuerzo y cena.
- Cuando hay dolor: colocar fomentos 3 minutos caliente 1 frío durante 30 minutos en la zona de la vesícula.
- No comer nada aparte de lo indicado. Para la expulsión de cálculos y lavado hidrocolónico, el último día internarse en instituto Vital Salud.
--------------------------------------------------
CÁPSULAS ADICIONALES (Tomar después del D/A/C):
--------------------------------------------------
- _____________________________________________
- _____________________________________________
- _____________________________________________
- _____________________________________________`
  },
  {
    nombre: '🎗️ CÁNCER',
    contenido: `CENTRO DE REHABILITACIÓN NATURAL VITAL SALUD SAC - CÁNCER
6:00 am. En ayunas tomar un vaso de agua tibia 250 ml más un limón y una cucharita de bicarbonato de sodio. Agregar 2 vasos de agua más.
6:30 am. Tomar 30 ml de jugo cítrico más 1 sobre de Immunocal regular azul más 1 sobre Immunocal optimizer, después de 3 días agregar 1 sobre de Inmunocal platinum.
8:00 am. Desayuno: Ensalada de vegetales más 1 cda germen de trigo y 1 cda de salvado de trigo más un cereal como quinua, trigo, avena más 6 almendras o 4 nueces o 1 cda de semillas de girasol. Tomar 5 cápsulas de espirulina más las cápsulas en la parte inferior. Masticar bien.
10:00 am. Tomar 1/2 litro de mate tibio de graviola o agua tibia sin azúcar.
11:00 am. Tomar zumo de perejil, berro, espinaca o acelga más extracto de zanahoria y apio (150 ml a 200 ml).
12:00 m. Tomar 30 ml de jugo cítrico más 1 sobre de Immunocal regular azul más 1 sobre Immunocal optimizer.
1:00 pm. Almuerzo: Ensalada de vegetales crudos más un segundo vegetariano. Poca sal de mar. (Consumir 2 veces por semana menestras como lentejas, frijol negro o rojo previamente remojado). Tomar 5 cápsulas de espirulina más las cápsulas en la parte inferior.
3:00 pm. Mate tibio, tomar medio litro.
5:00 pm. Tomar zumo de perejil, berro, espinaca o acelga más extracto de zanahoria y apio.
6:00 pm. Cena: Similar al desayuno. Tomar 3 cápsulas de espirulina más las cápsulas en la parte inferior.
8:00 pm. Tomar 30 ml de jugo cítrico más 1 sobre de Immunocal regular azul más 1 sobre Immunocal optimizer.
RECOMENDACIONES:
- NO COMER NADA APARTE DE LO INDICADO. Si tiene sed tome agua tibia. Tener en cuenta evacuaciones.
- Alimentación 70% crudo y 30% cocinado. Hábitos saludables, geoterapia con emplasto de barro o sábila en el abdomen, hidroterapia (baño de asiento, vapor, fricciones). Evitar grasas saturadas, azúcares y carnes.
--------------------------------------------------
CÁPSULAS ADICIONALES (Tomar después del D/A/C):
--------------------------------------------------
- _____________________________________________
- _____________________________________________
- _____________________________________________
- _____________________________________________`
  },
  {
    nombre: '🌿 PROGRAMA DETOX (3 DÍAS / 7 DÍAS)',
    contenido: `CENTRO DE REHABILITACIÓN NATURAL VITAL SALUD SAC - DETOX 3 Y 7 DÍAS
PRIMER DÍA:
6:00 AM: En ayunas 1 cdta de bicarbonato de sodio más 2 vasos de agua tibia.
6:30 AM: Tomar 30 ml zumo de naranja o agua con 1 sobre de Immunocal regular azul más 1 sobre Immunocal optimizer.
7:30 AM: 1/2 kg de papaya + 1 cda Nutrilax + 4 nueces + 5 espirulinas + cápsulas en la parte inferior.
10:00 AM: Tomar 1/2 lt mate de diente de león, canchalagua, flor de jamaica.
11:00 AM: Tomar 1 vaso de extracto milagroso (zanahoria, betarraga y apio).
12:30 PM: 1/2 kg de papaya + 1 cda Nutrilax + 4 nueces + 5 espirulinas.
3:00 PM: Tomar 1/2 lt mate de diente de león, canchalagua, flor de Jamaica.
4:00 PM: Tomar 1 vaso de extracto milagroso.
6:00 PM: 1/2 kg de papaya + 1 cda Nutrilax + 4 nueces + 3 espirulinas.
8:00 PM: Tomar 30 ml zumo de naranja o agua con 1 sobre de Immunocal regular azul más Immunocal optimizer.
SEGUNDO DÍA: Similar al primer día pero consumiendo 1/2 kg de manzana y 7 almendras en lugar de papaya.
TERCER DÍA: Jugo de naranja con Klon Plus, jugos de papaya con linaza, mates depurativos, sulfato de magnesio a las 3:00 PM y 5:00 PM, y a las 7:00 PM aceite de oliva con limones a baño maría.
--------------------------------------------------
CÁPSULAS ADICIONALES (Tomar después del D/A/C):
--------------------------------------------------
- _____________________________________________
- _____________________________________________
- _____________________________________________
- _____________________________________________`
  },
  {
    nombre: '💩 ESTREÑIMIENTO',
    contenido: `CENTRO DE REHABILITACIÓN NATURAL VITAL SALUD SAC - ESTREÑIMIENTO
- Practicar por 3 días régimen crudívoro de desintoxicación.
- Ayunas: Opción 1: remojar 4 ciruelas con una cucharada de linaza y tomar en ayunas. Opción 2: tomar 2 cucharadas de aceite de oliva o jugo de tamarindo.
- ANTES DEL DESAYUNO: Tomar 30 ml zumo de naranja o agua con 1 sobre de Immunocal regular azul más Immunocal optimizer.
- Desayuno (60% crudo - 40% cocinado): 1 plato de fruta (manzana, papaya, pera) más 8 pasas, 1 cda de salvado de trigo, 1 cda de germen de trigo, taza de cereal con leche vegetal.
- Almuerzo (60% crudo - 40% cocinado): Ensalada de vegetales variados (zanahoria rallada, nabo, betarraga, pepinillo, lechuga, apio, perejil). Medio plato de legumbres o proteínas vegetales y cereal integral (arroz, quinua).
- Cena: Una taza de agua de linaza remojada más ensalada de frutas (papaya, pera o uvas), 2 cdas de germen de trigo, 1 cda de miel de abejas, pan o galletas integrales.
- 30 MIN DESPUES DE LA CENA: Tomar 30 ml zumo de naranja o agua con Immunocal regular y optimizer.
- Recomendaciones: Lavado hidrocolónico previo, tomar 3 a 5 cápsulas de espirulina, 1 cápsula de selenio en la mañana y zinc en la noche, 1 cda de Nutrilax después de los alimentos por 10 días. Geoterapia e hidroterapia.
--------------------------------------------------
CÁPSULAS ADICIONALES (Tomar después del D/A/C):
--------------------------------------------------
- _____________________________________________
- _____________________________________________
- _____________________________________________
- _____________________________________________`
  },
  {
    nombre: '❤️ HIPERTENSIÓN ARTERIAL',
    contenido: `CENTRO DE REHABILITACIÓN NATURAL VITAL SALUD SAC - HIPERTENSIÓN ARTERIAL
6:00 am: Agua tibia con jugo de un limón u agua de ajo con limón o mate.
6:30 am: Tomar 30 ml zumo de naranja o agua con 1 sobre de Immunocal regular azul más Immunocal optimizer.
7:30 am: 1 copita de perejil.
8:00 am: Desayuno (porción de frutas 50%, cereales integrales más leche vegetal, camote o pan integral 50%).
10:00 am: Agua tibia u agua de ajo con limón o mate.
12:00 m: Extracto de vegetales.
12:30 pm: Agua tibia u agua de ajo con limón o mate.
1:00 pm: Almuerzo (ensalada de 5 colores, guiso de coliflor con arroz integral / croquetas de soya con choclo / menestras con quinua graneada).
3:00 pm / 5:00 pm: Zumo de uva 100 ml o agua tibia/mates.
6:00 pm: Cena (postre saludable / leche vegetal / jugo / crema de verduras / porción de frutas).
8:00 pm: Tomar 30 ml zumo de naranja o agua con Immunocal regular y optimizer.
RECOMENDACIONES: Consumir poco o nada de sal, dieta equilibrada, lavado hidrocolónico previo, cápsulas de espirulina, selenio, zinc y cordiceps (1 cápsula 3 veces al día). Mates institucionales (cola de caballo, ortiga, grama, barba de choclo). Geoterapia e hidroterapia.
--------------------------------------------------
CÁPSULAS ADICIONALES (Tomar después del D/A/C):
--------------------------------------------------
- _____________________________________________
- _____________________________________________
- _____________________________________________
- _____________________________________________`
  },
  {
    nombre: '🫁 ASMA Y ENFERMEDADES PULMONARES',
    contenido: `CENTRO DE REHABILITACIÓN NATURAL VITAL SALUD SAC - ASMA Y ENFERMEDADES PULMONARES
6:00 am: 1 o 2 vasos de agua alcalina tibia con jugo de un limón.
6:30 am: Tomar 30 ml zumo de naranja o agua con 1 sobre de Immunocal regular más Immunocal optimizer.
8:00 am: Desayuno (frutas 50%, cereales integrales con leche vegetal y melaza, camote o pan integral 50%) + 5 cápsulas de espirulina después.
10:00 am: Mate tibio.
12:00 m: Extracto de vegetales verdes.
1:00 pm: Almuerzo (ensalada de 5 colores 50%, guiso de coliflor con arroz integral / croquetas de soya con choclo / menestras 50%) + espirulina después.
3:00 pm: 3 oz de extracto de perejil más zanahoria (tibio).
5:00 pm: Zumo de uva 100 ml.
6:00 pm: Cena saludable + 3 cápsulas de espirulina después.
8:00 pm: Tomar 30 ml zumo de naranja o agua con Immunocal regular y optimizer.
RECOMENDACIONES: Tomar jarabe de cebolla y ajo (rallar media cebolla, 3 dientes de ajo, 2 limones, eucalipto y miel de abejas, hervir 5 min en 2 tazas de agua, tomar tibio 3 veces al día). Mates: eucalipto, mullaca, asmachilca, pulmonaria. Geoterapia y fomentos calientes en el tórax.
--------------------------------------------------
CÁPSULAS ADICIONALES (Tomar después del D/A/C):
--------------------------------------------------
- _____________________________________________
- _____________________________________________
- _____________________________________________
- _____________________________________________`
  },
  {
    nombre: '🟢 HÍGADO GRASO',
    contenido: `CENTRO DE REHABILITACIÓN NATURAL VITAL SALUD SAC - HÍGADO GRASO
- Practicar por 3 días de cada semana régimen crudívoro de desintoxicación.
- Ayunas: Opción 1: Cura de uvas (tomar una copita). Opción 2: Cura de limón (de 1 a 7 limones más 2 vasos de agua alcalina tibia).
- ANTES DEL DESAYUNO: Tomar 30 ml zumo de naranja o agua con 1 sobre de Immunocal regular azul más Immunocal optimizer.
- Desayuno: Una o dos frutas de la estación, rebanada de pan integral con miel, taza de cereal con leche vegetal + 5 cápsulas de espirulina después.
- Almuerzo (50% crudo - 50% cocinado): Ensalada de vegetales variados (zanahoria, nabo, betarraga, alcachofa, apio, perejil) 50%. Medio plato de lentejas sin aderezos con pizca de sal, queso de soya, arroz integral con espinacas al vapor 50% + espirulina después.
- Cena: Taza de agua de linaza remojada más ensalada de frutas (papaya, pera, uvas), 2 cdas de germen de trigo, 1 cda de miel, pan integral + 3 cápsulas de espirulina después.
- 30 MIN DESPUES DE LA CENA: Tomar 30 ml zumo de naranja o agua con Immunocal. Lavado hidrocolónico previo, selenio, zinc y cordiceps.
--------------------------------------------------
CÁPSULAS ADICIONALES (Tomar después del D/A/C):
--------------------------------------------------
- _____________________________________________
- _____________________________________________
- _____________________________________________
- _____________________________________________`
  },
  {
    nombre: '🍃 GASTRITIS',
    contenido: `CENTRO DE REHABILITACIÓN NATURAL VITAL SALUD SAC - GASTRITIS
- En ayunas y por las noches: Opción 1: Tomar extracto de papa más 30 gotas de aceite de copaiba más 7 gotas de sangre de grado (tibio). Opción 2: Sábila licuada con una cucharadita de carbón vegetal y miel al gusto.
- 30 MIN ANTES DEL DESAYUNO: Tomar 30 ml zumo de naranja o agua con 1 sobre de Immunocal regular más Immunocal optimizer.
- Desayuno (30% cocido, 70% crudo): Fruta fresca (manzana, uvas, papaya, duraznos o peras) 70%. Leche vegetal con avena o cereal integral, germen y salvado de trigo, agave 30% + 5 cápsulas de espirulina después.
- Media Mañana: Licuar un trocito de repollo más sábila en 1 taza de agua y colar. Zumo de pepinillo más un puñado de perejil.
- Almuerzo (30% cocido, 70% crudo): Ensalada cruda de vegetales con gotas de limón y aceite de oliva, hojas de repollo al vapor 70%. Puré de verduras con oleaginosas, calabaza o papas al horno con cáscara 30% + espirulina después.
- Cena: Similar al desayuno o jugo de frutas dulces temprano.
- Al dormir: Cataplasma de barro directamente sobre el vientre durante 2 horas. Carbón vegetal después de los alimentos. Mates: boldo, diente de león, hinojo, manzanilla, ajenjo.
--------------------------------------------------
CÁPSULAS ADICIONALES (Tomar después del D/A/C):
--------------------------------------------------
- _____________________________________________
- _____________________________________________
- _____________________________________________
- _____________________________________________`
  },
  {
    nombre: '🟡 COLESTEROL ALTO',
    contenido: `CENTRO DE REHABILITACIÓN NATURAL VITAL SALUD SAC - COLESTEROL ALTO
- Ayunas: Opción 1: Cura de uvas (una copita). Opción 2: Cura de limón (1 a 7 limones más 2 vasos de agua tibia).
- 30 MIN ANTES DEL DESAYUNO: Tomar 30 ml zumo de naranja o agua con Immunocal regular y optimizer.
- Desayuno (60% crudo - 40% cocinado): 1 plato de ensalada de frutas (papaya, pera, pitahaya, sandía o melón) 60%. Un vaso de leche de almendras y cereales integrales con agave 40% + espirulina después.
- Media Mañana / Media Tarde: Agua de ajo con zumo de un limón.
- Almuerzo (60% crudo - 40% cocinado): Ensalada de verduras 60% + segundo vegetariano equilibrado 40% + espirulina después.
- Cena: Ensalada de frutas o vegetales + 3 cápsulas de espirulina después.
- 30 MIN DESPUES DE LA CENA: Tomar 30 ml zumo de naranja o agua con Immunocal.
- Recomendaciones: Lavado hidrocolónico previo, selenio, zinc y copita de extracto de 48 plantas 3 veces al día. Mates: uña de gato, diente de león, boldo, alcachofa.
--------------------------------------------------
CÁPSULAS ADICIONALES (Tomar después del D/A/C):
--------------------------------------------------
- _____________________________________________
- _____________________________________________
- _____________________________________________
- _____________________________________________`
  },
  {
    nombre: '🔹 PROSTATITIS',
    contenido: `CENTRO DE REHABILITACIÓN NATURAL VITAL SALUD SAC - PROSTATITIS
6:00 am: Agua tibia con jugo de un limón con una cucharadita de bicarbonato de sodio.
6:30 am: Tomar 30 ml zumo de naranja o agua con Immunocal regular y optimizer.
7:30 am: 1 copita de perejil.
8:00 am: Desayuno (porción de frutas 50%, cereales integrales más leche vegetal, camote o pan integral 50%) + espirulina después.
10:00 am / 12:30 pm / 3:00 pm: Mate tibio.
12:00 m: Extracto de vegetales.
1:00 pm: Almuerzo (ensalada de 5 colores, guiso de coliflor con arroz integral / croquetas de soya con choclo / menestras con quinua graneada) + espirulina después.
5:00 pm: Zumo de uva 100 ml.
6:00 pm: Cena (postre saludable / leche vegetal / jugo / crema de verduras) + 3 cápsulas de espirulina después.
7:30 pm: Vaso de agua.
8:00 pm: Tomar 30 ml zumo de naranja o agua con Immunocal regular y optimizer.
RECOMENDACIONES: Lavado hidrocolónico previo, selenio, zinc, cápsulas de cordiceps (1 cápsula 3 veces al día). Geoterapia (arcilla al abdomen y zona adolorida) e hidroterapia.
--------------------------------------------------
CÁPSULAS ADICIONALES (Tomar después del D/A/C):
--------------------------------------------------
- _____________________________________________
- _____________________________________________
- _____________________________________________
- _____________________________________________`
  },
  {
    nombre: '⚖️ OBESIDAD',
    contenido: `CENTRO DE REHABILITACIÓN NATURAL VITAL SALUD SAC - OBESIDAD
Ayunas: Jugo de piña más una cucharada de quemador de grasa natural.
30 MIN ANTES DEL DESAYUNO: Tomar 30 ml zumo de naranja o agua con Immunocal regular y optimizer.
Desayuno (60% crudo - 40% cocinado): 1 plato de ensalada de frutas (manzana, papaya) 60% + 1 tostada integral y taza de cereales 40% + espirulina después.
Media Mañana: Jugo de piña o agua alcalina.
Almuerzo: Ensalada variada (lechuga, zanahoria, tomate, pepino, pimiento, apio, escarola, espárragos, rábano) 60% + segundo vegetariano bajo en carbohidratos 40% + espirulina después.
Media Tarde: Jugo de piña o agua de alcachofa.
Cena: 3 manzanas + 3 cápsulas de espirulina después.
30 MIN DESPUES DE LA CENA: Tomar 30 ml zumo de naranja o agua con Immunocal regular y optimizer.
RECOMENDACIONES: Lavado hidrocolónico previo, selenio, zinc, cordiceps. Hábitos saludables, geoterapia e hidroterapia.
--------------------------------------------------
CÁPSULAS ADICIONALES (Tomar después del D/A/C):
--------------------------------------------------
- _____________________________________________
- _____________________________________________
- _____________________________________________
- _____________________________________________`
  },
  {
    nombre: '📈 DELGADEZ',
    contenido: `CENTRO DE REHABILITACIÓN NATURAL VITAL SALUD SAC - DELGADEZ
Ayunas: Opción 1: Zumo cítrico. Opción 2: Licuar un vaso de zumo de piña más 4 nueces más una cucharada de linaza.
30 MIN ANTES DEL DESAYUNO: Tomar 30 ml zumo de naranja o agua con Immunocal.
Desayuno (50% cocido, 50% crudo): Fruta fresca (manzana, uvas, papaya, durazno, peras, 2 plátanos) 50% + leche vegetal, fruta seca con higos, ciruelas, avena, germen y salvado de trigo, agave 50% + 1 cdta de espirulina y cápsulas de la parte inferior.
Media Mañana: Licuar 2 plátanos más 1 cda de quinua sancochada + 1 cdta de miel + 5 cápsulas de levadura de cerveza.
Almuerzo (50% cocido, 50% crudo): Ensalada cruda de vegetales con limón y aceite de oliva, hojas de repollo al vapor 50% + puré de verduras con oleaginosas o menestras con arroz integral 50% + 10 espirulinas. Repetir licuado de media mañana con levadura de cerveza.
Cena: Similar al desayuno + 3 cápsulas de espirulina.
Al dormir: Cataplasma de barro en el vientre por 2 horas. Carbón vegetal después de los alimentos.
--------------------------------------------------
CÁPSULAS ADICIONALES (Tomar después del D/A/C):
--------------------------------------------------
- _____________________________________________
- _____________________________________________
- _____________________________________________
- _____________________________________________`
  },
  {
    nombre: '🌹 ROSÁCEA Y ACNÉ',
    contenido: `CENTRO DE REHABILITACIÓN NATURAL VITAL SALUD SAC - ROSÁCEA Y ACNÉ
6:00 am: En ayunas licuar 2 paletas de tuna más el zumo de 10 limones en un litro de agua (tibio) + 5 cápsulas de espirulina.
6:30 am: Tomar 30 ml zumo de naranja o agua con Immunocal regular y optimizer.
7:00 am: Agua de ajo con zumo de 1/2 limón más 30 gotas de ganoderma (tibio).
8:00 am: Desayuno (60% crudo y 40% cocido).
10:00 am / 12:00 m / 3:00 pm / 5:00 pm: Mate de canchalagua, diente de león y alcachofa (2 vasos) + ganoderma o espirulina.
11:00 am: Extracto milagroso (3 zanahorias, 3 tallos de apio, 1 betarraga).
1:00 pm: Almuerzo (60% crudo y 40% cocido).
4:00 pm: Un vaso de jugo de tomate con alfalfa.
6:00 pm: Cena ligera (un plato de ensalada de frutas + 2 cucharadas de sábila).
8:00 pm: Agua de ajo con zumo de 1/2 limón + 2 cápsulas de ganoderma.
8:30 pm: Tomar 30 ml zumo de naranja o agua con Immunocal.
9:00 pm: Emplasto de arcilla al abdomen.
RECOMENDACIONES: Lavarse el rostro con mate de manzanilla, emplasto de espirulina, avena y sábila en el rostro durante la noche.
--------------------------------------------------
CÁPSULAS ADICIONALES (Tomar después del D/A/C):
--------------------------------------------------
- _____________________________________________
- _____________________________________________
- _____________________________________________
- _____________________________________________`
  },
  {
    nombre: '💧 INFLAMACIÓN DE RIÑONES',
    contenido: `CENTRO DE REHABILITACIÓN NATURAL VITAL SALUD SAC - INFLAMACIÓN DE RIÑONES
- Cura previa de sandía (3 a 4 días): tomar 1 vaso de jugo de sandía en ayunas. Después de los 3 días, desayuno, almuerzo y cena solo frutas o verduras en zumos o ensaladas.
6:00 am: Fricción de agua fría (pies calientes).
6:30 am: Tomar 2 vasos de agua tibia con 1 limón + 4 cdas de sábila licuada.
7:00 am: Tomar 30 ml zumo de naranja o agua con Immunocal regular y optimizer.
7:30 am: Tomar 1 1/2 vaso de extracto de zanahoria + perejil.
8:00 am: Desayuno (cereales integrales + leche vegetal + frutas: sandía, melón, peras, manzanas, duraznos, papaya, fresas, kiwi).
10:00 am: Mate de cola de caballo, barba de choclo, verbena, semillas de cebada, malva, perejil y diente de león.
12:00 m: Mate de cocción de zanahoria (hervir 2 zanahorias por 20 min).
1:00 pm: Almuerzo (ensalada de vegetales: tomate, choclo tierno, alcachofa, col, brócoli, apio + segundo vegetariano).
6:00 pm: Cena (ensalada de vegetales o frutas).
8:00 pm: Tomar 30 ml zumo de naranja o agua con Immunocal.
RECOMENDACIONES: Lavado colónico previo, espirulina, geoterapia con arcilla al abdomen y zona de riñones, macerar 1 kilo de cebolla tostada en 1 litro de agua para la zona adolorida.
--------------------------------------------------
CÁPSULAS ADICIONALES (Tomar después del D/A/C):
--------------------------------------------------
- _____________________________________________
- _____________________________________________
- _____________________________________________
- _____________________________________________`
  },
  {
    nombre: '🟢 QUISTES DE RIÑÓN',
    contenido: `CENTRO DE REHABILITACIÓN NATURAL VITAL SALUD SAC - QUISTES DE RIÑÓN
6:00 am: Agua tibia con jugo de un limón.
6:30 am: Jugo de piña licuado con una cucharada de linaza remojada y 4 nueces.
7:00 am: Tomar 30 ml zumo de naranja o agua con Immunocal regular y optimizer.
7:30 am: 1 vaso de jugo de arándanos (150 g de arándanos licuados).
8:00 am: Desayuno (frutas 50%: melón, sandía, pera, manzana, arándanos + cereales integrales con leche vegetal o pan integral 50%).
10:00 am / 12:30 pm / 3:00 pm / 7:30 pm: Mate de ortiga con cola de caballo y perejil (2 vasos tibios).
12:00 m: Extracto de vegetales (1/2 pepinillo, 3 tallos de apio, 1 puñado de perejil).
1:00 pm: Almuerzo (ensalada de 5 colores 50% + segundo vegetariano 50%).
5:00 pm: Zumo de uva una copita.
6:00 pm: Cena (postre saludable / crema de verduras / frutas).
8:00 pm: Tomar 30 ml zumo de naranja o agua con Immunocal.
RECOMENDACIONES: Lavado hidrocolónico cada 3 meses, espirulina 30 min antes de cada alimento, selenio, zinc, ganoderma (2 cápsulas después de cada alimento), 1 sobre de calcio disuelto en agua a las 10 am y 4 pm. Baños de asiento en agua fría y vapor.
--------------------------------------------------
CÁPSULAS ADICIONALES (Tomar después del D/A/C):
--------------------------------------------------
- _____________________________________________
- _____________________________________________
- _____________________________________________
- _____________________________________________`
  },
  {
    nombre: '🪨 CÁLCULOS RENALES (10 DÍAS)',
    contenido: `CENTRO DE REHABILITACIÓN NATURAL VITAL SALUD SAC - CÁLCULOS RENALES (10 DÍAS)
6:00 am: Fricción de agua fría por todo el cuerpo (pies calientes).
6:10 am: Tomar 2 oz de extracto de papa más 9 oz de extracto de choclo más una cucharada de gel de sábila.
6:45 am: Tomar mate de 3 plantas frescas (diente de león, agracejo, cola de caballo, ortiga, chanca piedra, flor de arena, barba de choclo) (2 vasos).
7:30 am: Tomar 30 ml zumo de naranja o agua con Immunocal regular y optimizer.
8:00 am: Desayuno: consumir un plato de manzanas, peras, plátano de isla más germen y salvado de trigo, 5 almendras o nueces y 5 cápsulas de espirulina.
10:00 am: Extracto de apio, berro, zanahoria, betarraga (200 ml).
12:00 m: Tomar mate de 3 plantas institucionales (2 vasos).
1:00 pm: Almuerzo: 1 plato de ensalada de vegetales (brócoli, berro, apio, rábano, diente de león, zanahoria, pepinillo, choclo sancochado) con aceite de oliva y 5 cápsulas de espirulina (nada de sal).
3:00 pm / 7:30 pm: Tomar mate de 3 plantas (2 vasos).
5:00 pm: Tomar 2 oz de extracto de papa más 9 oz de extracto de choclo con gel de sábila.
6:00 pm: Cena: manzanas, peras, plátano de isla, germen y salvado de trigo, nueces y 2 cápsulas de espirulina.
8:00 pm: Tomar 30 ml zumo de naranja o agua con Immunocal.
RECOMENDACIONES: Tomar 30 gotas de aceite de copaiba después de cada comida. Fomentos calientes y fríos en la zona de los riñones. Geoterapia e hidroterapia. Último día internamiento en Vital Salud.
--------------------------------------------------
CÁPSULAS ADICIONALES (Tomar después del D/A/C):
--------------------------------------------------
- _____________________________________________
- _____________________________________________
- _____________________________________________
- _____________________________________________`
  },
  {
    nombre: '🩸 ANEMIA',
    contenido: `CENTRO DE REHABILITACIÓN NATURAL VITAL SALUD SAC - ANEMIA
6:00 am: Tomar 1 o 2 vasos de agua tibia.
6:30 am: Tomar 1 vaso jugo de naranja con piña.
7:00 am: Tomar 3 oz de extracto de perejil más zanahoria (tibio).
7:30 am: Tomar 30 ml zumo de naranja o agua con 1 sobre de Immunocal regular azul más Immunocal optimizer.
8:00 am: Desayuno (porción de frutas 50%, cereales integrales más leche vegetal más melaza o agave, camote o pan integral 50%).
10:00 am: Tomar extracto de 3 zanahorias, 1 tallo de apio y 1 puñado de espinacas.
12:00 m: Tomar extracto de vegetales verdes.
12:30 pm: Tomar 1 vaso de agua tibia.
1:00 pm: Almuerzo (ensalada de 5 colores, guiso de coliflor con arroz integral / croquetas de soya con choclo / menestras con quinua graneada).
3:00 pm: Tomar 3 oz de extracto de perejil más zanahoria (tibio).
5:00 pm: Tomar zumo de uva 100 ml.
6:00 pm: Cena (postre saludable / leche vegetal / crema de verduras / frutas).
7:30 pm: Tomar 3 oz de extracto de perejil más zanahoria más una cucharadita de agave (tibio).
8:00 pm: Tomar 30 ml zumo de naranja o agua con Immunocal.
RECOMENDACIONES: Dieta equilibrada, lavado hidrocolónico opcional, tomar 3 a 5 cápsulas de espirulina con cada alimento, selenio, zinc, agua alcalina, mates institucionales (diente de león, manayupa), geoterapia e hidroterapia.
--------------------------------------------------
CÁPSULAS ADICIONALES (Tomar después del D/A/C):
--------------------------------------------------
- _____________________________________________
- _____________________________________________
- _____________________________________________
- _____________________________________________`
  }
];
function ConsultorioPageContent() {
  const searchParams = useSearchParams();
  const dniParam = searchParams.get('dni');
  const [pacientesEspera, setPacientesEspera] = useState<PacienteEnEspera[]>([]);
  const [pacienteSeleccionado, setPacienteSeleccionado] = useState<PacienteEnEspera | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [historialConsultas, setHistorialConsultas] = useState<ConsultaGuardada[]>([]);
  const [verHistorialModal, setVerHistorialModal] = useState<boolean>(false);
  
  // Modal de visor con Zoom
  const [imagenModal, setImagenModal] = useState<string | null>(null);
  const [tipoModal, setTipoModal] = useState('image/jpeg');
  const [carpetaAbierta, setCarpetaAbierta] = useState(false);
  const [carpetaConsulta, setCarpetaConsulta] = useState<ConsultaGuardada | null>(null);
  const [adjuntosCarpeta, setAdjuntosCarpeta] = useState<AdjuntoConsulta[]>([]);
  const [archivosPendientes, setArchivosPendientes] = useState<File[]>([]);
  const [consultaPendienteId, setConsultaPendienteId] = useState<string | number | null>(null);
  const [cargandoCarpeta, setCargandoCarpeta] = useState(false);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  
  const [consulta, setConsulta] = useState({
    motivo: '',
    diagnostico: '',
    receta: '',
    dieta: '',
    imagen_url: ''
  });
  
  useEffect(() => {
    fetchPacientesTodos();

    // Sincronización automática cuando el paciente cambia o se elimina en otro módulo
    const handlePacienteChange = () => {
      fetchPacientesTodos();
    };

    window.addEventListener('paciente_activo_changed', handlePacienteChange);
    window.addEventListener('storage', handlePacienteChange);

    return () => {
      window.removeEventListener('paciente_activo_changed', handlePacienteChange);
      window.removeEventListener('storage', handlePacienteChange);
    };
  }, [dniParam]);

  const fetchPacientesTodos = async () => {
    try {
      setLoading(true);
      const resTriaje = await fetch('/api/triaje');
      let triajesData: PacienteEnEspera[] = [];
      if (resTriaje.ok) {
        triajesData = await resTriaje.json();
      }
      const resPacientes = await fetch('/api/pacientes');
      let basePacientesData: any[] = [];
      if (resPacientes.ok) {
        basePacientesData = await resPacientes.json();
      }
      const mapaPacientes = new Map<string, PacienteEnEspera>();
      basePacientesData.forEach((p) => {
        const dni = p.dni || p.dni_paciente;
        if (dni) {
          mapaPacientes.set(dni, {
            id: p.id || Date.now(),
            dni_paciente: dni,
            nombre_paciente: p.nombre || p.nombre_paciente || 'Paciente sin nombre',
            edad: p.edad || ''
          });
        }
      });
      triajesData.forEach((t) => {
        const dni = t.dni_paciente || t.dni;
        if (dni) {
          const prev = mapaPacientes.get(dni);
          mapaPacientes.set(dni, {
            ...prev,
            ...t,
            dni_paciente: dni,
            nombre_paciente: t.nombre_paciente || prev?.nombre_paciente || 'Paciente sin nombre'
          });
        }
      });
      const listaCompleta = Array.from(mapaPacientes.values());
      setPacientesEspera(listaCompleta);
      
      let dniTarget = dniParam;
      if (!dniTarget) {
        const guardado = localStorage.getItem('paciente_activo_vital_salud');
        if (guardado) {
          try {
            const parsed = JSON.parse(guardado);
            if (parsed && parsed.dni) {
              dniTarget = parsed.dni;
            }
          } catch (e) {
            console.error('Error al leer paciente activo:', e);
          }
        }
      }
      let seleccionado: PacienteEnEspera | null = null;
      if (dniTarget) {
        seleccionado = listaCompleta.find(p => (p.dni_paciente || p.dni) === dniTarget) || null;
      }
      if (!seleccionado && listaCompleta.length > 0) {
        seleccionado = listaCompleta[0];
      }

      if (seleccionado) {
        setPacienteSeleccionado(seleccionado);
        const dniSel = seleccionado.dni_paciente || seleccionado.dni || '';
        cargarHistorialPaciente(dniSel);
        localStorage.setItem('paciente_activo_vital_salud', JSON.stringify({
          dni: dniSel,
          nombre: seleccionado.nombre_paciente || seleccionado.nombre || ''
        }));
      } else {
        setPacienteSeleccionado(null);
        localStorage.removeItem('paciente_activo_vital_salud');
      }
    } catch (err) {
      console.error('Error cargando cola unificada de consultorio:', err);
    } finally {
      setLoading(false);
    }
  };

  const cargarHistorialPaciente = async (dni: string) => {
    if (!dni) return;
    try {
      const res = await fetch(`/api/consulta?dni=${dni}`);
      if (res.ok) {
        const data = await res.json();
        setHistorialConsultas(data);
      }
    } catch (err) {
      console.error('Error al obtener historial del paciente:', err);
    }
  };

  const handleEliminarConsultaHistorial = async (consultaItem: ConsultaGuardada) => {
    if (confirm('¿Estás seguro de eliminar este registro de consulta?')) {
      try {
        const identifier = consultaItem.id || consultaItem.fecha;
        const response = await fetch(`/api/consulta?id=${encodeURIComponent(identifier)}`, { method: 'DELETE' });
        if (!response.ok) throw new Error((await response.json()).error || 'No se pudo eliminar la consulta');
        if (pacienteSeleccionado) {
          const dniSel = pacienteSeleccionado.dni_paciente || pacienteSeleccionado.dni || '';
          cargarHistorialPaciente(dniSel);
        }
      } catch (err) {
        console.error('Error al eliminar consulta:', err);
        alert(err instanceof Error ? err.message : 'No se pudo eliminar la consulta');
      }
    }
  };

  const handleSeleccionarPaciente = (p: PacienteEnEspera) => {
    setArchivosPendientes([]);
    setConsultaPendienteId(null);
    setCarpetaAbierta(false);
    setPacienteSeleccionado(p);
    const dni = p.dni_paciente || p.dni || '';
    cargarHistorialPaciente(dni);
    localStorage.setItem('paciente_activo_vital_salud', JSON.stringify({
      dni: dni,
      nombre: p.nombre_paciente || p.nombre || ''
    }));
    window.dispatchEvent(new Event('paciente_activo_changed'));
  };

  const handleSeleccionarDietaPreset = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const seleccion = DIETAS_VITAL_SALUD.find(d => d.nombre === e.target.value);
    if (seleccion) {
      setConsulta(prev => ({
        ...prev,
        dieta: seleccion.contenido
      }));
    }
  };

  const handleImagenUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (archivosPendientes.length + files.length > 50) alert('Se permiten hasta 50 adjuntos por consulta.');
    else if (files.some(file => file.size === 0 || file.size > 3 * 1024 * 1024 || !['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'].includes(file.type))) {
      alert('Solo imágenes JPG, PNG, WebP, GIF o PDF de hasta 3 MB por archivo.');
    } else setArchivosPendientes(prev => [...prev, ...files]);
    e.target.value = '';
  };

  const cargarAdjuntosConsulta = async (id: string | number) => {
    const res = await fetch(`/api/consulta/adjuntos?id=${id}`);
    if (!res.ok) throw new Error((await res.json()).error || 'No se pudieron cargar los adjuntos');
    const items: AdjuntoConsulta[] = await res.json();
    setAdjuntosCarpeta(items);
    return items;
  };

  const abrirCarpeta = async (item: ConsultaGuardada | null) => {
    setCarpetaConsulta(item);
    setAdjuntosCarpeta([]);
    setCarpetaAbierta(true);
    if (item) {
      setCargandoCarpeta(true);
      try { await cargarAdjuntosConsulta(item.id); }
      catch (error) { alert(error instanceof Error ? error.message : 'No se pudo abrir la carpeta'); }
      finally { setCargandoCarpeta(false); }
    }
  };

  const subirArchivoConsulta = async (id: string | number, archivo: File) => {
    const data = new FormData();
    data.append('consulta_id', String(id));
    data.append('archivo', archivo);
    const res = await fetch('/api/consulta/adjuntos', { method: 'POST', body: data });
    if (!res.ok) throw new Error((await res.json()).error || `No se pudo subir ${archivo.name}`);
  };

  const handleAgregarHistorial = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (!carpetaConsulta || files.length === 0) return;
    if (adjuntosCarpeta.length + files.length > 50) { alert('Se permiten hasta 50 adjuntos por consulta.'); return; }
    if (files.some(file => file.size === 0 || file.size > 3 * 1024 * 1024 || !['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'].includes(file.type))) {
      alert('Solo imágenes JPG, PNG, WebP, GIF o PDF de hasta 3 MB por archivo.'); return;
    }
    setCargandoCarpeta(true);
    try {
      for (const file of files) await subirArchivoConsulta(carpetaConsulta.id, file);
      await cargarAdjuntosConsulta(carpetaConsulta.id);
    } catch (error) {
      try { await cargarAdjuntosConsulta(carpetaConsulta.id); } catch { /* conservar el error de subida */ }
      alert(error instanceof Error ? error.message : 'No se pudieron subir todos los archivos');
    } finally { setCargandoCarpeta(false); }
  };

  const eliminarAdjuntoConsulta = async (id: number) => {
    if (!confirm('¿Eliminar este adjunto?')) return;
    const res = await fetch(`/api/consulta/adjuntos?id=${id}`, { method: 'DELETE' });
    if (res.ok) setAdjuntosCarpeta(prev => prev.filter(item => item.id !== id));
    else alert('No se pudo eliminar el adjunto.');
  };

  const abrirVisorZoom = (url: string) => {
    setImagenModal(url);
    setTipoModal('image/jpeg');
    setZoomLevel(1);
  };

  const abrirArchivo = (url: string, tipo: string) => {
    setImagenModal(url);
    setTipoModal(tipo);
    setZoomLevel(1);
  };

  const cerrarVisor = () => {
    if (imagenModal?.startsWith('blob:')) URL.revokeObjectURL(imagenModal);
    setImagenModal(null);
  };

  const handleLimpiarCampos = () => {
    if (consulta.motivo || consulta.diagnostico || consulta.receta || consulta.dieta || archivosPendientes.length) {
      if (confirm('¿Estás seguro de que deseas borrar los datos ingresados en esta consulta?')) {
        setConsulta({ motivo: '', diagnostico: '', receta: '', dieta: '', imagen_url: '' });
        setArchivosPendientes([]);
        setConsultaPendienteId(null);
      }
    } else {
      setConsulta({ motivo: '', diagnostico: '', receta: '', dieta: '', imagen_url: '' });
      setArchivosPendientes([]);
      setConsultaPendienteId(null);
    }
  };

  const handleFinalizarConsulta = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pacienteSeleccionado) {
      alert('Selecciona un paciente de la cola de espera');
      return;
    }
    try {
      setSaving(true);
      const dni = pacienteSeleccionado.dni_paciente || pacienteSeleccionado.dni || '';
      const nuevaConsulta: ConsultaGuardada = {
        id: Date.now(),
        dni_paciente: dni,
        fecha: new Date().toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' }),
        motivo: consulta.motivo,
        diagnostico: consulta.diagnostico,
        receta: consulta.receta,
        dieta: consulta.dieta,
        imagen_url: ''
      };
      let id = consultaPendienteId;
      if (!id) {
        const response = await fetch('/api/consulta', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(nuevaConsulta)
        });
        if (!response.ok) throw new Error((await response.json()).error || 'No se pudo guardar la consulta');
        id = (await response.json()).id;
        setConsultaPendienteId(id);
      }
      if (id === null) throw new Error('No se recibió el identificador de la consulta');
      for (const archivo of archivosPendientes) {
        await subirArchivoConsulta(id, archivo);
        setArchivosPendientes(prev => prev.filter(item => item !== archivo));
      }
      await cargarHistorialPaciente(dni);
      alert(`✅ Consulta y dieta guardadas con éxito para ${pacienteSeleccionado.nombre_paciente || dni}`);
      setConsulta({ motivo: '', diagnostico: '', receta: '', dieta: '', imagen_url: '' });
      setArchivosPendientes([]);
      setConsultaPendienteId(null);
    } catch (err) {
      console.error('Error guardando consulta:', err);
      alert(err instanceof Error ? err.message : 'No se pudo guardar la consulta');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-100 font-sans text-slate-900">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 md:ml-64 transition-all">
        <header className="h-16 md:h-20 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-8 sticky top-0 z-20 shadow-sm">
          <span className="text-xs md:text-sm text-slate-500 font-medium truncate">
            Módulo Médico / <strong className="text-slate-900">Atención en Consultorio</strong>
          </span>
          <span className="text-xs text-teal-700 font-extrabold bg-teal-50 px-3 py-1.5 rounded-full border border-teal-200 flex items-center gap-2 shrink-0">
            👨‍⚕️ Dr. Administrador — Vital Salud
          </span>
        </header>
        <main className="p-4 md:p-8 flex flex-col gap-6 max-w-7xl mx-auto w-full">
          <div className="grid grid-cols-1 lg:grid-cols-[330px_1fr] gap-6 items-start">
            {/* COLA DE ESPERA */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-4 md:p-5 text-white">
                <h2 className="m-0 text-base font-extrabold text-white">👥 Cola de Espera ({pacientesEspera.length})</h2>
                <p className="m-0 text-xs text-slate-400">Pacientes registrados</p>
              </div>
              <div className="p-3 flex flex-col gap-2 max-h-[450px] lg:max-h-[calc(100vh-220px)] overflow-y-auto">
                {loading ? (
                  <p className="text-center text-slate-500 text-xs py-5">Cargando...</p>
                ) : pacientesEspera.length === 0 ? (
                  <p className="text-center text-slate-400 text-xs py-5">No hay pacientes.</p>
                ) : (
                  pacientesEspera.map((p) => {
                    const isSelected = pacienteSeleccionado?.dni_paciente === (p.dni_paciente || p.dni) || pacienteSeleccionado?.dni === (p.dni_paciente || p.dni);
                    return (
                      <div
                        key={p.id || p.dni_paciente || p.dni}
                        onClick={() => handleSeleccionarPaciente(p)}
                        className={`p-3 rounded-xl border cursor-pointer transition-all flex justify-between items-center ${
                          isSelected ? 'border-teal-500 bg-teal-50/60 shadow-sm' : 'border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <div>
                          <h4 className="m-0 text-xs md:text-sm font-extrabold text-slate-900">
                            {p.nombre_paciente || p.nombre || 'Paciente'}
                          </h4>
                          <span className="text-[11px] text-slate-500 font-semibold">DNI: {p.dni_paciente || p.dni}</span>
                        </div>
                        <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-lg shrink-0 ${
                          isSelected ? 'bg-teal-100 text-teal-800' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {isSelected ? 'Atendiendo' : 'Atender ➔'}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
            {/* FICHA Y FORMULARIO */}
            <div className="flex flex-col gap-6 w-full min-w-0">
              {pacienteSeleccionado ? (
                <div className="flex flex-col gap-6 animate-fadeIn">
                  {/* EXPEDIENTE ACTIVO */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-5 md:p-6 shadow-sm">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                      <div>
                        <span className="text-[11px] font-extrabold text-teal-600 uppercase tracking-wider">
                          EXPEDIENTE ACTIVO EN CONSULTORIO
                        </span>
                        <h2 className="m-0 text-xl md:text-2xl font-black text-slate-900 mt-0.5">
                          {pacienteSeleccionado.nombre_paciente || pacienteSeleccionado.nombre}
                        </h2>
                        <span className="text-xs text-slate-500 font-semibold">
                          DNI: {pacienteSeleccionado.dni_paciente || pacienteSeleccionado.dni} {pacienteSeleccionado.edad ? `• ${pacienteSeleccionado.edad} años` : ''}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2 items-center">
                        <button
                          type="button"
                          onClick={() => setVerHistorialModal(!verHistorialModal)}
                          className="bg-sky-50 text-sky-700 border border-sky-200 px-3 py-1.5 rounded-xl font-extrabold text-xs cursor-pointer hover:bg-sky-100 transition-all flex items-center gap-1.5"
                        >
                          📋 {verHistorialModal ? 'Ocultar Historial' : `Ver Atenciones (${historialConsultas.length})`}
                        </button>
                        <span className="bg-emerald-50 text-teal-700 border border-emerald-200 px-3 py-1 rounded-full text-xs font-extrabold">
                          🟢 En Consulta
                        </span>
                      </div>
                    </div>
                    {/* SIGNOS VITALES */}
                    <div className="flex flex-wrap gap-2 pt-3 border-t border-slate-100">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-rose-50 text-rose-600 border border-rose-200">
                        🌡️ T°: {pacienteSeleccionado.temperatura ? `${pacienteSeleccionado.temperatura}°C` : '-'}
                      </span>
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-sky-50 text-sky-700 border border-sky-200">
                        ❤️ P/A: {pacienteSeleccionado.presion_arterial || pacienteSeleccionado.presion || '-'}
                      </span>
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        🫀 Pulso: {pacienteSeleccionado.pulso || pacienteSeleccionado.frecuencia_cardiaca || '-'} bpm
                      </span>
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                        ⚖️ Peso: {pacienteSeleccionado.peso ? `${pacienteSeleccionado.peso} kg` : '-'}
                      </span>
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
                        📏 Talla: {pacienteSeleccionado.talla ? `${pacienteSeleccionado.talla} cm` : '-'}
                      </span>
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-slate-50 text-slate-700 border border-slate-200">
                        📊 IMC: {pacienteSeleccionado.imc || '-'}
                      </span>
                    </div>
                    {/* HISTORIAL PREVIO */}
                    {verHistorialModal && (
                      <div className="mt-5 pt-4 border-t-2 border-dashed border-slate-200">
                        <h4 className="m-0 text-xs font-extrabold text-slate-900 mb-3">📁 Consultas y Dietas Anteriores</h4>
                        {historialConsultas.length === 0 ? (
                          <div className="p-4 bg-slate-50 rounded-xl text-center border border-slate-200 text-xs text-slate-500">
                            Sin consultas previas registradas para este paciente.
                          </div>
                        ) : (
                          <div className="flex flex-col gap-2.5 max-h-60 overflow-y-auto">
                            {historialConsultas.map((h, i) => (
                              <div key={h.id || i} className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs flex flex-col gap-1">
                                <div className="flex justify-between items-center">
                                  <span className="font-bold text-teal-700">📅 {h.fecha}</span>
                                  <button
                                    type="button"
                                    onClick={() => handleEliminarConsultaHistorial(h)}
                                    className="px-2.5 py-1 bg-rose-50 text-rose-600 border border-rose-200 rounded-lg font-extrabold text-[10px] cursor-pointer hover:bg-rose-100 transition-all"
                                  >
                                    🗑️ Eliminar Consulta
                                  </button>
                                </div>
                                {h.motivo && <p className="m-0"><strong>Motivo:</strong> {h.motivo}</p>}
                                {h.diagnostico && <p className="m-0"><strong>Diagnóstico:</strong> {h.diagnostico}</p>}
                                {h.receta && <p className="m-0 text-teal-800"><strong>Receta:</strong> {h.receta}</p>}
                                {h.dieta && <p className="m-0 text-purple-800 whitespace-pre-line"><strong>Dieta:</strong> {h.dieta}</p>}
                                <button type="button" onClick={() => abrirCarpeta(h)} className="mt-1 px-2.5 py-1.5 bg-teal-50 text-teal-800 border border-teal-200 rounded-lg font-bold text-[11px] cursor-pointer hover:bg-teal-100 text-left w-fit">
                                  📁 Abrir carpeta de fotos y exámenes
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  {/* FORMULARIO DE ATENCIÓN */}
                  <form onSubmit={handleFinalizarConsulta} className="bg-white rounded-2xl border border-slate-200 p-5 md:p-6 shadow-sm flex flex-col gap-4">
                    <div className="bg-gradient-to-br from-teal-600 to-teal-800 p-4 rounded-xl text-white flex items-center gap-3">
                      <span className="text-xl">📝</span>
                      <div>
                        <h3 className="m-0 text-sm md:text-base font-extrabold text-white">Evaluación Clínica, Receta y Dieta Especializada</h3>
                        <p className="m-0 text-xs text-teal-100">Diseñado exclusivamente para el paciente actual</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] font-extrabold text-slate-900 mb-1 uppercase tracking-wider">
                          MOTIVO DE CONSULTA Y SÍNTOMAS
                        </label>
                        <textarea
                          rows={3}
                          value={consulta.motivo}
                          onChange={(e) => setConsulta({ ...consulta, motivo: e.target.value })}
                          placeholder="Descripción detallada de síntomas..."
                          className="w-full p-3 rounded-xl border border-slate-300 bg-slate-50 font-semibold text-slate-900 text-xs md:text-sm outline-none focus:border-teal-600 focus:bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-extrabold text-slate-900 mb-1 uppercase tracking-wider">
                          DIAGNÓSTICO CLÍNICO
                        </label>
                        <textarea
                          rows={3}
                          value={consulta.diagnostico}
                          onChange={(e) => setConsulta({ ...consulta, diagnostico: e.target.value })}
                          placeholder="Diagnóstico médico o código CIE-10..."
                          className="w-full p-3 rounded-xl border border-slate-300 bg-slate-50 font-semibold text-slate-900 text-xs md:text-sm outline-none focus:border-teal-600 focus:bg-white"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11px] font-extrabold text-slate-900 mb-1 uppercase tracking-wider">
                        💊 PRESCRIPCIÓN / RECETA MÉDICA
                      </label>
                      <textarea
                        rows={3}
                        value={consulta.receta}
                        onChange={(e) => setConsulta({ ...consulta, receta: e.target.value })}
                        placeholder="Ejemplo: Immunocal regular 1 sobre c/12 horas + Cápsulas de espirulina..."
                        className="w-full p-3 rounded-xl border border-slate-300 bg-slate-50 font-semibold text-slate-900 text-xs md:text-sm outline-none focus:border-teal-600 focus:bg-white"
                      />
                    </div>
                    {/* SECCIÓN DE DIETAS AMPLIADA Y ESTRUCTURADA */}
                    <div className="p-4 bg-purple-50 rounded-2xl border border-purple-200 flex flex-col gap-3">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                        <label className="text-xs font-extrabold text-purple-900 uppercase tracking-wider">
                          🥗 SELECCIONAR Y EDITAR DIETA INSTITUCIONAL (VITAL SALUD)
                        </label>
                        <select
                          onChange={handleSeleccionarDietaPreset}
                          className="p-2.5 rounded-xl border border-purple-300 bg-white font-bold text-xs text-purple-900 outline-none shadow-sm cursor-pointer w-full sm:w-auto"
                        >
                          <option value="">-- Seleccionar Dieta Institucional Completa --</option>
                          {DIETAS_VITAL_SALUD.map((d, index) => (
                            <option key={index} value={d.nombre}>{d.nombre}</option>
                          ))}
                        </select>
                      </div>
                      <p className="m-0 text-[11px] text-purple-700">
                        💡 Al seleccionar una patología arriba, se cargará <strong>todo el protocolo completo junto con las cápsulas adicionales (D/A/C)</strong> en el recuadro inferior, el cual puedes editar o complementar libremente.
                      </p>
                      <textarea
                        rows={12}
                        value={consulta.dieta}
                        onChange={(e) => setConsulta({ ...consulta, dieta: e.target.value })}
                        placeholder="Seleccione una dieta arriba o escriba el plan nutricional personalizado aquí mismo..."
                        className="w-full p-3 rounded-xl border border-purple-300 bg-white font-medium text-slate-900 text-xs md:text-sm outline-none focus:border-purple-600 shadow-sm font-mono whitespace-pre-wrap"
                      />
                    </div>
                    {/* ADJUNTAR FOTO O EXAMEN */}
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col gap-3">
                      <label className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                        📁 FOTOS Y EXÁMENES CLÍNICOS DE ESTA CONSULTA
                      </label>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif,application/pdf"
                        multiple
                        onChange={handleImagenUpload}
                        className="text-xs font-bold text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-extrabold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100 cursor-pointer"
                      />
                      <p className="m-0 text-xs text-slate-600">Hasta 50 imágenes o PDF de 3 MB cada uno. Se guardan con la consulta.</p>
                      <button type="button" onClick={() => abrirCarpeta(null)} className="bg-white border border-teal-200 rounded-xl p-3 text-left text-sm font-bold text-teal-900 hover:bg-teal-50 cursor-pointer">
                        📁 Abrir carpeta de adjuntos ({archivosPendientes.length}/50)
                      </button>
                    </div>
                    {/* BOTONES */}
                    <div className="flex flex-col sm:flex-row justify-end gap-3 pt-2">
                      <button
                        type="button"
                        onClick={handleLimpiarCampos}
                        className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-xl font-extrabold text-xs md:text-sm cursor-pointer transition-all"
                      >
                        🧹 Limpiar Formulario
                      </button>
                      <button
                        type="submit"
                        disabled={saving}
                        className="px-5 py-3 bg-teal-600 hover:bg-teal-700 text-white border-none rounded-xl font-extrabold text-xs md:text-sm cursor-pointer shadow-md transition-all flex items-center justify-center gap-2"
                      >
                        <span>✅</span> {saving ? 'Guardando...' : 'Finalizar Atención y Guardar Ficha'}
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
                  <span className="text-4xl block mb-2">👨‍⚕️</span>
                  <h3 className="text-slate-900 font-extrabold text-base md:text-lg mb-1">Selecciona un paciente</h3>
                  <p className="text-slate-500 text-xs md:text-sm m-0">Elige un paciente de la cola de espera para iniciar su atención médica.</p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
      {carpetaAbierta && (
        <div className="fixed inset-0 z-40 bg-black/70 flex items-center justify-center p-4" onClick={() => setCarpetaAbierta(false)}>
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-auto p-5 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-extrabold text-teal-900">📁 {carpetaConsulta ? `Adjuntos de la consulta · ${carpetaConsulta.fecha}` : 'Adjuntos para la nueva consulta'}</h3>
              <button type="button" onClick={() => setCarpetaAbierta(false)} className="font-bold text-slate-700">✕</button>
            </div>
            {carpetaConsulta && <div className="mb-3">
              <label className="block text-xs font-bold text-teal-800 mb-1">Agregar fotos o PDF a esta consulta ({adjuntosCarpeta.length}/50)</label>
              <input type="file" multiple accept="image/jpeg,image/png,image/webp,image/gif,application/pdf" onChange={handleAgregarHistorial} disabled={cargandoCarpeta} className="text-xs max-w-full" />
            </div>}
            {cargandoCarpeta && <p className="text-xs text-slate-500">Cargando archivos...</p>}
            {!cargandoCarpeta && adjuntosCarpeta.length + (carpetaConsulta ? 0 : archivosPendientes.length) + (carpetaConsulta?.imagen_url ? 1 : 0) === 0 && <p className="text-sm text-slate-500">Esta carpeta está vacía.</p>}
            <div className="space-y-2">
              {carpetaConsulta?.imagen_url && <div className="flex items-center gap-2 p-2 border rounded-lg text-sm">
                <span className="truncate flex-1">🖼️ Imagen anterior de la consulta</span>
                <button type="button" className="text-teal-800 font-bold" onClick={() => abrirVisorZoom(carpetaConsulta.imagen_url!)}>Abrir</button>
              </div>}
              {adjuntosCarpeta.map(item => <div key={item.id} className="flex items-center gap-2 p-2 border rounded-lg text-sm">
                <span className="truncate flex-1">{item.tipo.startsWith('image/') ? '🖼️' : '📄'} {item.nombre}</span>
                <button type="button" className="text-teal-800 font-bold" onClick={() => abrirArchivo(`/api/consulta/adjuntos/${item.id}`, item.tipo)}>Abrir</button>
                <button type="button" className="text-rose-700 font-bold" onClick={() => eliminarAdjuntoConsulta(item.id)}>Eliminar</button>
              </div>)}
              {!carpetaConsulta && archivosPendientes.map((item, index) => <div key={`${item.name}-${index}`} className="flex items-center gap-2 p-2 border rounded-lg text-sm">
                <span className="truncate flex-1">{item.type.startsWith('image/') ? '🖼️' : '📄'} {item.name} · Pendiente de guardar</span>
                <button type="button" className="text-teal-800 font-bold" onClick={() => abrirArchivo(URL.createObjectURL(item), item.type)}>Abrir</button>
                <button type="button" className="text-rose-700 font-bold" onClick={() => setArchivosPendientes(prev => prev.filter((_, i) => i !== index))}>Quitar</button>
              </div>)}
            </div>
          </div>
        </div>
      )}
      {/* MODAL CON ZOOM Y CONTROL INTERACTIVO */}
      {imagenModal && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-50 flex flex-col items-center justify-between p-4 sm:p-6 animate-fadeIn">
          <div className="w-full max-w-5xl flex items-center justify-between bg-slate-800/80 px-4 py-3 rounded-2xl border border-slate-700 text-white backdrop-blur">
            <span className="text-xs sm:text-sm font-extrabold flex items-center gap-2">
              🔬 Visor de Examen Clínico / Imagen
            </span>
            <div className="flex items-center gap-2">
              {tipoModal.startsWith('image/') && <button
                type="button"
                onClick={() => setZoomLevel(prev => Math.max(0.5, prev - 0.25))}
                className="bg-slate-700 hover:bg-slate-600 text-white px-3 py-1.5 rounded-xl font-black text-sm border border-slate-600 cursor-pointer"
                title="Alejar (-)"
              >
                ➖
              </button>}
              {tipoModal.startsWith('image/') && <span className="text-xs font-mono font-bold px-2 py-1 bg-slate-900 rounded-lg border border-slate-700">
                {Math.round(zoomLevel * 100)}%
              </span>}
              {tipoModal.startsWith('image/') && <button
                type="button"
                onClick={() => setZoomLevel(prev => Math.min(3, prev + 0.25))}
                className="bg-slate-700 hover:bg-slate-600 text-white px-3 py-1.5 rounded-xl font-black text-sm border border-slate-600 cursor-pointer"
                title="Acercar (+)"
              >
                ➕
              </button>}
              {tipoModal.startsWith('image/') && <button
                type="button"
                onClick={() => setZoomLevel(1)}
                className="bg-slate-700 hover:bg-slate-600 text-white px-3 py-1.5 rounded-xl font-bold text-xs border border-slate-600 cursor-pointer ml-2"
              >
                Restablecer
              </button>}
              <button
                type="button"
                onClick={cerrarVisor}
                className="bg-rose-600 hover:bg-rose-700 text-white w-8 h-8 rounded-xl font-black text-sm cursor-pointer border border-rose-500 ml-3 flex items-center justify-center"
                title="Cerrar"
              >
                ✕
              </button>
            </div>
          </div>
          <div className="w-full max-w-5xl flex-1 my-4 flex items-center justify-center overflow-auto rounded-2xl bg-slate-950/50 border border-slate-800 p-4">
            {tipoModal === 'application/pdf' ? <iframe src={imagenModal} title="Examen clínico PDF" className="w-full h-[70vh] bg-white rounded-lg" /> : <div className="transition-transform duration-200 ease-out flex items-center justify-center" style={{ transform: `scale(${zoomLevel})` }}>
              <img
                src={imagenModal}
                alt="Examen clínico ampliado"
                className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-2xl select-none"
              />
            </div>}
          </div>
          <span className="text-slate-400 text-xs font-semibold">
            {tipoModal.startsWith('image/') ? 'Utiliza los botones superiores ➕ ➖ para acercar y alejar la imagen.' : 'Examen clínico en PDF.'}
          </span>
        </div>
      )}
    </div>
  );
}
export default function ConsultorioPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500 font-bold">Cargando...</div>}>
      <ConsultorioPageContent />
    </Suspense>
  );
}

