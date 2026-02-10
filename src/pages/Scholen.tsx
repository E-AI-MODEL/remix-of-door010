import { useState, useMemo } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { PageHero } from "@/components/shared/PageHero";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { Search, MapPin, Globe, ExternalLink, School as SchoolIcon } from "lucide-react";
import { useSchools, type School } from "@/hooks/useSchools";

const sectors = ["Alle sectoren", "PO", "VO", "MBO"];

function getSchoolName(school: School) {
  return school.VESTIGINGSNAAM || school.INSTELLINGSNAAM || "Onbekend";
}

function getSchoolAddress(school: School) {
  const parts = [
    school.STRAATNAAM,
    school["HUISNUMMER-TOEVOEGING"],
    school.POSTCODE,
    school.PLAATSNAAM,
  ].filter(Boolean);
  return parts.join(" ") || null;
}

function getSchoolBrin(school: School) {
  return school.VESTIGINGSCODE || school.INSTELLINGSCODE || null;
}

export default function Scholen() {
  const [selectedSector, setSelectedSector] = useState("Alle sectoren");
  const [searchQuery, setSearchQuery] = useState("");
  const { data, isLoading, error } = useSchools();

  const allSchools = useMemo(() => {
    if (!data?.sectors) return [];
    return data.sectors.flatMap(({ sector, schools }) =>
      schools.map((s) => ({ ...s, _sector: sector }))
    );
  }, [data]);

  const filteredSchools = useMemo(() => {
    let result = allSchools;
    if (selectedSector !== "Alle sectoren") {
      result = result.filter((s) => s._sector === selectedSector);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((s) => {
        const name = getSchoolName(s).toLowerCase();
        const address = getSchoolAddress(s)?.toLowerCase() || "";
        return name.includes(q) || address.includes(q);
      });
    }
    return result;
  }, [allSchools, selectedSector, searchQuery]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <PageHero
          variant="image"
          title="SCHOLEN"
          titleHighlight="ROTTERDAM"
          subtitle="Ontdek alle scholen in de regio Rotterdam — van primair onderwijs tot mbo."
        />

        {/* Filters */}
        <section className="bg-background py-6 border-b border-border sticky top-16 z-40">
          <div className="container">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex flex-wrap gap-2">
                {sectors.map((sector) => (
                  <Button
                    key={sector}
                    variant={selectedSector === sector ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedSector(sector)}
                  >
                    {sector}
                  </Button>
                ))}
              </div>
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Zoek op schoolnaam of adres..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Results */}
        <section className="py-12 md:py-16">
          <div className="container">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 9 }).map((_, i) => (
                  <div key={i} className="bg-background border border-border rounded-lg p-6">
                    <Skeleton className="h-5 w-3/4 mb-3" />
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <p className="text-destructive">Fout bij het laden van schooldata.</p>
                <p className="text-muted-foreground text-sm mt-2">Probeer het later opnieuw.</p>
              </div>
            ) : (
              <>
                <p className="text-muted-foreground mb-8">
                  <span className="font-semibold text-foreground">{filteredSchools.length}</span> scholen gevonden
                  {data?.lastUpdated && (
                    <span className="ml-2 text-xs">
                      · Laatst bijgewerkt: {new Date(data.lastUpdated).toLocaleDateString("nl-NL")}
                    </span>
                  )}
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredSchools.slice(0, 150).map((school, index) => {
                    const name = getSchoolName(school);
                    const address = getSchoolAddress(school);
                    const website = school.INTERNETADRES;

                    return (
                      <motion.div
                        key={`${getSchoolBrin(school) || index}-${index}`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: Math.min(index * 0.02, 0.5) }}
                        className="bg-background border border-border rounded-lg p-6 hover:border-primary/50 hover:shadow-lg transition-all"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="bg-primary/10 rounded-full p-2">
                            <SchoolIcon className="h-5 w-5 text-primary" />
                          </div>
                          <Badge variant="secondary" className="uppercase text-xs">
                            {school._sector}
                          </Badge>
                        </div>

                        <h3 className="font-semibold text-foreground mb-2 leading-tight">
                          {name}
                        </h3>

                        {address && (
                          <p className="text-sm text-muted-foreground flex items-start gap-1.5 mb-2">
                            <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                            {address}
                          </p>
                        )}

                        {getSchoolBrin(school) && (
                          <p className="text-xs text-muted-foreground mb-3">
                            BRIN: {getSchoolBrin(school)}
                          </p>
                        )}

                        {website && (
                          <a
                            href={website.startsWith("http") ? website : `https://${website}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center text-sm text-primary font-medium hover:underline"
                          >
                            <Globe className="mr-1.5 h-3.5 w-3.5" />
                            Website
                            <ExternalLink className="ml-1 h-3 w-3" />
                          </a>
                        )}
                      </motion.div>
                    );
                  })}
                </div>

                {filteredSchools.length > 150 && (
                  <p className="text-center text-muted-foreground mt-8 text-sm">
                    Toont 150 van {filteredSchools.length} scholen. Gebruik de zoekbalk om te verfijnen.
                  </p>
                )}
              </>
            )}
          </div>
        </section>

        {/* Onderwijsregio links */}
        <section className="bg-muted py-12 md:py-16">
          <div className="container">
            <h2 className="text-xl font-bold text-foreground mb-8 uppercase tracking-wide">
              Onderwijsregio <span className="text-primary">Rotterdam</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <a
                href="https://www.onderwijsregio.nl/wij-zijn-de-onderwijsregios/zuidwest-nederland/rotterdam-po"
                target="_blank"
                rel="noopener noreferrer"
                className="group bg-background border border-border rounded-lg p-6 hover:border-primary/50 hover:shadow-lg transition-all"
              >
                <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors mb-2">
                  Onderwijsregio Rotterdam — Primair Onderwijs
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Informatie over de samenwerking in het primair onderwijs in de regio Rotterdam.
                </p>
                <span className="text-sm text-primary font-medium flex items-center">
                  Bekijk pagina <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
                </span>
              </a>
              <a
                href="https://www.onderwijsregio.nl/wij-zijn-de-onderwijsregios/zuidwest-nederland/rotterdam-vo-mbo"
                target="_blank"
                rel="noopener noreferrer"
                className="group bg-background border border-border rounded-lg p-6 hover:border-primary/50 hover:shadow-lg transition-all"
              >
                <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors mb-2">
                  Onderwijsregio Rotterdam — VO & MBO
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Informatie over de samenwerking in het voortgezet onderwijs en mbo in Rotterdam.
                </p>
                <span className="text-sm text-primary font-medium flex items-center">
                  Bekijk pagina <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
                </span>
              </a>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
