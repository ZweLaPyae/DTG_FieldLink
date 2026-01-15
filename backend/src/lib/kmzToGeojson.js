import AdmZip from "adm-zip";
import { DOMParser } from "@xmldom/xmldom";
import toGeoJSON from "@mapbox/togeojson";
import fs from "fs";

export async function kmzToGeoJson(kmzPath) {
  if (!fs.existsSync(kmzPath)) {
    throw new Error("KMZ file not found on disk");
  }

  // 1️⃣ unzip KMZ
  const zip = new AdmZip(kmzPath);
  const entries = zip.getEntries();

  // 2️⃣ find ANY .kml file
  const kmlEntry = entries.find(e =>
    e.entryName.toLowerCase().endsWith(".kml")
  );

  if (!kmlEntry) {
    throw new Error("No KML file found inside KMZ");
  }

  // 3️⃣ read KML text
  const kmlText = kmlEntry.getData().toString("utf8");

  // 4️⃣ parse XML
  const dom = new DOMParser().parseFromString(kmlText, "text/xml");

  // 5️⃣ convert to GeoJSON
  const geojson = toGeoJSON.kml(dom);

  return geojson;
}
