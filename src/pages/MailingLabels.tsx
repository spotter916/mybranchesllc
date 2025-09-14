import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Printer, AlertTriangle, Grid3x3, Target, Ruler, Eye, Settings, HelpCircle } from "lucide-react";
import { useHouseholdSubscription } from "@/hooks/useHouseholdSubscription";
import UpgradePrompt from "@/components/UpgradePrompt";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

interface MailingAddress {
  id: string;
  name: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export default function MailingLabels() {
  const { groupId } = useParams();
  const { hasPremium, canAccessFeature } = useHouseholdSubscription();
  const [isPrintMode, setIsPrintMode] = useState(false);
  const [showAlignmentGrid, setShowAlignmentGrid] = useState(false);
  const [showTestPattern, setShowTestPattern] = useState(false);
  const [showMeasurements, setShowMeasurements] = useState(false);
  const [printPreviewMode, setPrintPreviewMode] = useState(false);

  const {
    data: mailingAddresses,
    isLoading,
    error,
  } = useQuery<MailingAddress[]>({
    queryKey: [`/api/groups/${groupId}/mailing-labels`],
    enabled: !!groupId && hasPremium,
  });

  // Filter addresses that are complete
  const completeAddresses = mailingAddresses?.filter(
    (addr) => addr.street && addr.city && addr.state && addr.zipCode
  ) || [];

  const incompleteAddresses = mailingAddresses?.filter(
    (addr) => !addr.street || !addr.city || !addr.state || !addr.zipCode
  ) || [];

  // Chunk addresses into pages of 30 labels each
  const addressPages = [];
  for (let i = 0; i < completeAddresses.length; i += 30) {
    addressPages.push(completeAddresses.slice(i, i + 30));
  }

  const handlePrint = () => {
    // Disable test mode features before printing
    setShowAlignmentGrid(false);
    setShowTestPattern(false);
    setShowMeasurements(false);
    setPrintPreviewMode(false);
    setTimeout(() => {
      window.print();
    }, 100);
  };

  const handleTestPrint = () => {
    // Show test pattern for alignment verification
    setShowTestPattern(true);
    setShowAlignmentGrid(true);
    setTimeout(() => {
      window.print();
    }, 100);
  };

  // Check for premium access
  if (!hasPremium || !canAccessFeature('hasMailingLabels')) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href={`/groups/${groupId}/settings`}>
            <Button variant="outline" size="sm" data-testid="button-back">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Group Settings
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-foreground" data-testid="text-labels-title">
              Mailing Labels
            </h1>
            <p className="text-muted-foreground">Premium feature required</p>
          </div>
        </div>
        <UpgradePrompt
          feature="Mailing Labels"
          description="Generate printable mailing labels for all households in your group. Perfect for holiday cards and invitations."
        />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href={`/groups/${groupId}/settings`}>
            <Button variant="outline" size="sm" data-testid="button-back">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Group Settings
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Mailing Labels</h1>
            <p className="text-muted-foreground">Loading addresses...</p>
          </div>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (error) {
    const errorData = error as any;
    const isUpgradeRequired = errorData?.requiresUpgrade;

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href={`/groups/${groupId}/settings`}>
            <Button variant="outline" size="sm" data-testid="button-back">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Group Settings
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Mailing Labels</h1>
            <p className="text-muted-foreground">Error loading addresses</p>
          </div>
        </div>
        {isUpgradeRequired ? (
          <UpgradePrompt
            feature="Mailing Labels"
            description="Generate printable mailing labels for all households in your group. Perfect for holiday cards and invitations."
          />
        ) : (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Unable to load mailing labels</h3>
                <p className="text-muted-foreground mb-4">
                  There was an error loading the mailing addresses for this group.
                </p>
                <Button onClick={() => window.location.reload()}>Try Again</Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  if (!mailingAddresses || mailingAddresses.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href={`/groups/${groupId}/settings`}>
            <Button variant="outline" size="sm" data-testid="button-back">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Group Settings
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Mailing Labels</h1>
            <p className="text-muted-foreground">No households found</p>
          </div>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Printer className="h-12 w-12 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No households to print</h3>
              <p className="text-muted-foreground">
                This group doesn't have any households with mailing addresses set up yet.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header - Hidden when printing */}
      <div className="print:hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href={`/groups/${groupId}/settings`}>
              <Button variant="outline" size="sm" data-testid="button-back">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Group Settings
              </Button>
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-3xl font-bold text-foreground" data-testid="text-labels-title">
                  Mailing Labels
                </h1>
                <Badge variant="outline" className="text-xs">
                  Avery 5160
                </Badge>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>{completeAddresses.length} addresses ready</span>
                {addressPages.length > 1 && (
                  <span>{addressPages.length} sheets needed</span>
                )}
                <span>•</span>
                <span>2.625" × 1" labels</span>
                <span>•</span>
                <span>30 per sheet</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              onClick={handleTestPrint} 
              variant="outline" 
              data-testid="button-test-print"
            >
              <Target className="h-4 w-4 mr-2" />
              Test Print
            </Button>
            <Button onClick={handlePrint} data-testid="button-print" size="lg">
              <Printer className="h-4 w-4 mr-2" />
              Print Labels
            </Button>
          </div>
        </div>

        {/* Alignment Testing Controls */}
        <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/20 dark:border-orange-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-800 dark:text-orange-200">
              <Target className="h-5 w-5" />
              Alignment Testing Tools
              <Badge variant="secondary" className="text-xs ml-2">Recommended</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="alignment-grid"
                  checked={showAlignmentGrid}
                  onCheckedChange={setShowAlignmentGrid}
                  data-testid="switch-alignment-grid"
                />
                <Label htmlFor="alignment-grid" className="flex items-center gap-2">
                  <Grid3x3 className="h-4 w-4" />
                  Grid Overlay
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="test-pattern"
                  checked={showTestPattern}
                  onCheckedChange={setShowTestPattern}
                  data-testid="switch-test-pattern"
                />
                <Label htmlFor="test-pattern" className="flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Test Pattern
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="measurements"
                  checked={showMeasurements}
                  onCheckedChange={setShowMeasurements}
                  data-testid="switch-measurements"
                />
                <Label htmlFor="measurements" className="flex items-center gap-2">
                  <Ruler className="h-4 w-4" />
                  Measurements
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="preview-mode"
                  checked={printPreviewMode}
                  onCheckedChange={setPrintPreviewMode}
                  data-testid="switch-preview-mode"
                />
                <Label htmlFor="preview-mode" className="flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Print Preview
                </Label>
              </div>
            </div>
            <div className="mt-4 text-sm text-orange-700 dark:text-orange-300">
              💡 <strong>Tip:</strong> Before printing your labels, use "Test Print" with Grid Overlay and Test Pattern enabled to verify alignment on a plain sheet of paper.
            </div>
          </CardContent>
        </Card>

        {/* Warnings for incomplete addresses */}
        {incompleteAddresses.length > 0 && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Missing address information:</strong> {incompleteAddresses.length} household(s) have incomplete addresses and won't be printed:{" "}
              {incompleteAddresses.map(addr => addr.name).join(", ")}.
              Please ask these households to complete their address information in their household settings.
            </AlertDescription>
          </Alert>
        )}

        {/* Enhanced Instructions with Tabs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Printing Guide & Troubleshooting
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="instructions" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="instructions" data-testid="tab-instructions">Instructions</TabsTrigger>
                <TabsTrigger value="troubleshooting" data-testid="tab-troubleshooting">Troubleshooting</TabsTrigger>
                <TabsTrigger value="testing" data-testid="tab-testing">Test Process</TabsTrigger>
                <TabsTrigger value="specifications" data-testid="tab-specifications">Specifications</TabsTrigger>
              </TabsList>
              
              <TabsContent value="instructions" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <Printer className="h-4 w-4" />
                      Required Print Settings
                    </h4>
                    <div className="space-y-2">
                      <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                        <div className="font-medium text-green-800 dark:text-green-200 mb-1">✓ Critical Settings</div>
                        <ul className="space-y-1 text-green-700 dark:text-green-300 text-xs">
                          <li>• Scale: "Actual size" or "100%" (NOT "Fit to page")</li>
                          <li>• Orientation: Portrait</li>
                          <li>• Margins: None/Borderless</li>
                          <li>• Paper: 8.5" × 11" / Letter</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      Label Information
                    </h4>
                    <div className="space-y-2">
                      <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                        <div className="font-medium text-blue-800 dark:text-blue-200 mb-1">Avery 5160 Specifications</div>
                        <ul className="space-y-1 text-blue-700 dark:text-blue-300 text-xs">
                          <li>• 30 labels per sheet (3 columns × 10 rows)</li>
                          <li>• Each label: 2.625" wide × 1" tall</li>
                          <li>• Compatible brands: Avery, Office Depot, Amazon Basics</li>
                          <li>• Alternative codes: 8160, 18160, 48160</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="troubleshooting" className="space-y-4">
                <div className="space-y-4">
                  <div className="p-4 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                    <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      Common Alignment Issues
                    </h4>
                    <div className="space-y-3 text-sm">
                      <div>
                        <div className="font-medium text-yellow-700 dark:text-yellow-300">Problem: Labels print too small or too large</div>
                        <div className="text-yellow-600 dark:text-yellow-400">Solution: Check print scale is set to "Actual size" or "100%". Disable "Fit to page" or "Shrink to fit".</div>
                      </div>
                      <div>
                        <div className="font-medium text-yellow-700 dark:text-yellow-300">Problem: Labels are shifted left/right</div>
                        <div className="text-yellow-600 dark:text-yellow-400">Solution: Ensure printer margins are set to 0. Try different paper guides in your printer.</div>
                      </div>
                      <div>
                        <div className="font-medium text-yellow-700 dark:text-yellow-300">Problem: Labels are shifted up/down</div>
                        <div className="text-yellow-600 dark:text-yellow-400">Solution: Check paper is properly aligned in printer tray. Some printers need a 0.1" top margin adjustment.</div>
                      </div>
                      <div>
                        <div className="font-medium text-yellow-700 dark:text-yellow-300">Problem: Text appears blurry or pixelated</div>
                        <div className="text-yellow-600 dark:text-yellow-400">Solution: Select "High Quality" or "Best" print mode. Ensure ink/toner levels are adequate.</div>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="testing" className="space-y-4">
                <div className="space-y-4">
                  <h4 className="font-medium flex items-center gap-2">
                    <HelpCircle className="h-4 w-4" />
                    Step-by-Step Test Process
                  </h4>
                  <ol className="list-decimal list-inside space-y-3 text-sm pl-4">
                    <li className="flex items-start gap-2">
                      <span className="font-medium min-w-0 flex-1">
                        <span className="text-blue-600 dark:text-blue-400">Enable Testing Tools:</span> Turn on "Grid Overlay" and "Test Pattern" using the switches above.
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-medium min-w-0 flex-1">
                        <span className="text-blue-600 dark:text-blue-400">Test Print:</span> Click "Test Print" to print alignment guides on plain paper (don't waste label sheets!).
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-medium min-w-0 flex-1">
                        <span className="text-blue-600 dark:text-blue-400">Check Alignment:</span> Place the test print over a label sheet and hold up to light to verify alignment.
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-medium min-w-0 flex-1">
                        <span className="text-blue-600 dark:text-blue-400">Adjust if Needed:</span> If misaligned, check printer settings and try different paper positioning.
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-medium min-w-0 flex-1">
                        <span className="text-green-600 dark:text-green-400">Final Print:</span> When alignment is perfect, disable testing tools and click "Print Labels".
                      </span>
                    </li>
                  </ol>
                  <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                    <div className="font-medium text-green-800 dark:text-green-200 text-sm mb-1">💡 Pro Tips</div>
                    <ul className="text-xs text-green-700 dark:text-green-300 space-y-1">
                      <li>• Test on 2-3 sheets of plain paper before using expensive label sheets</li>
                      <li>• Keep your first successful test print as a template for future batches</li>
                      <li>• Different printers may need slight adjustments - document what works for yours</li>
                    </ul>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="specifications" className="space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-medium flex items-center gap-2">
                      <Ruler className="h-4 w-4" />
                      Exact Measurements
                    </h4>
                    <div className="font-mono text-sm bg-gray-50 dark:bg-gray-900 p-4 rounded-lg space-y-2">
                      <div><strong>Sheet Size:</strong> 8.5" × 11" (Letter)</div>
                      <div><strong>Label Size:</strong> 2.625" × 1.000"</div>
                      <div><strong>Columns:</strong> 3 (spacing: 0.125")</div>
                      <div><strong>Rows:</strong> 10 (no spacing)</div>
                      <div><strong>Top Margin:</strong> 0.5"</div>
                      <div><strong>Side Margins:</strong> 0.1875" each</div>
                      <div><strong>Labels per Sheet:</strong> 30</div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h4 className="font-medium">Compatible Products</h4>
                    <div className="space-y-3 text-sm">
                      <div className="p-3 border rounded-lg">
                        <div className="font-medium">Avery Products</div>
                        <div className="text-muted-foreground">5160, 8160, 18160, 48160, 5960</div>
                      </div>
                      <div className="p-3 border rounded-lg">
                        <div className="font-medium">Office Depot</div>
                        <div className="text-muted-foreground">Brand 505-O004-0007, OME-LBL-160</div>
                      </div>
                      <div className="p-3 border rounded-lg">
                        <div className="font-medium">Amazon Basics</div>
                        <div className="text-muted-foreground">White Address Labels</div>
                      </div>
                      <div className="p-3 border rounded-lg">
                        <div className="font-medium">Generic/Store Brand</div>
                        <div className="text-muted-foreground">Look for "2⅝" × 1" format</div>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Print Area - Avery 5160 Format */}
      <div className={`avery-5160-container print:block ${
        showAlignmentGrid ? 'show-alignment-grid' : ''
      } ${
        showMeasurements ? 'show-measurements' : ''
      } ${
        printPreviewMode ? 'print-preview-mode' : ''
      }`}>
        {addressPages.map((pageAddresses, pageIndex) => (
          <div key={pageIndex} className={`avery-5160-page ${pageIndex < addressPages.length - 1 ? 'page-break-after' : ''}`}>
            {pageAddresses.map((address, index) => (
              <div key={address.id} className="avery-5160-label" data-testid={`label-${pageIndex * 30 + index}`}>
                {/* Corner markers for alignment testing */}
                {showTestPattern && (
                  <>
                    <div className="corner-marker top-left"></div>
                    <div className="corner-marker top-right"></div>
                    <div className="corner-marker bottom-left"></div>
                    <div className="corner-marker bottom-right"></div>
                  </>
                )}
                
                {/* Measurement guides */}
                {showMeasurements && (
                  <>
                    <div className="measurement-guide horizontal-top">2.625"</div>
                    <div className="measurement-guide vertical-left">1"</div>
                  </>
                )}
                
                {/* Label content */}
                <div className="label-content">
                  {showTestPattern ? (
                    <>
                      <div className="test-pattern-content">
                        <div className="text-xs font-bold">#{pageIndex * 30 + index + 1}</div>
                        <div className="text-xs">2.625" × 1"</div>
                        <div className="text-xs">Avery 5160</div>
                        <div className="test-border"></div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="font-semibold">{address.name}</div>
                      <div>{address.street}</div>
                      <div>
                        {address.city}, {address.state} {address.zipCode}
                      </div>
                      {address.country && address.country !== "United States" && (
                        <div>{address.country}</div>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}
            
            {/* Fill remaining slots with empty labels for proper alignment */}
            {Array.from({ length: Math.max(0, 30 - pageAddresses.length) }, (_, index) => (
              <div key={`empty-${pageIndex}-${index}`} className="avery-5160-label">
                {/* Corner markers for empty labels in test mode */}
                {showTestPattern && (
                  <>
                    <div className="corner-marker top-left"></div>
                    <div className="corner-marker top-right"></div>
                    <div className="corner-marker bottom-left"></div>
                    <div className="corner-marker bottom-right"></div>
                    <div className="label-content">
                      <div className="test-pattern-content">
                        <div className="text-xs font-bold">#{pageIndex * 30 + pageAddresses.length + index + 1}</div>
                        <div className="text-xs">Empty</div>
                        <div className="test-border"></div>
                      </div>
                    </div>
                  </>
                )}
                
                {/* Measurement guides for alignment */}
                {showMeasurements && index === 0 && (
                  <>
                    <div className="measurement-guide horizontal-top">2.625"</div>
                    <div className="measurement-guide vertical-left">1"</div>
                  </>
                )}
              </div>
            ))}
          </div>
        ))}
        
        {/* If no addresses, show empty page with test pattern */}
        {addressPages.length === 0 && (
          <div className="avery-5160-page">
            {Array.from({ length: 30 }, (_, index) => (
              <div key={`empty-${index}`} className="avery-5160-label">
                {/* Test pattern for empty page */}
                {showTestPattern && (
                  <>
                    <div className="corner-marker top-left"></div>
                    <div className="corner-marker top-right"></div>
                    <div className="corner-marker bottom-left"></div>
                    <div className="corner-marker bottom-right"></div>
                    <div className="label-content">
                      <div className="test-pattern-content">
                        <div className="text-xs font-bold">#{index + 1}</div>
                        <div className="text-xs">2.625" × 1"</div>
                        <div className="text-xs">Test Pattern</div>
                        <div className="test-border"></div>
                      </div>
                    </div>
                  </>
                )}
                
                {/* Show measurements on first label */}
                {showMeasurements && index === 0 && (
                  <>
                    <div className="measurement-guide horizontal-top">2.625"</div>
                    <div className="measurement-guide vertical-left">1"</div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Measurement Rulers - Only visible on screen */}
      {showMeasurements && (
        <div className="measurement-rulers print:hidden">
          <div className="ruler ruler-horizontal">
            <div className="ruler-marks">
              {Array.from({ length: 17 }, (_, i) => (
                <div key={i} className="ruler-mark" style={{ left: `${(i * 0.5 / 8.5) * 100}%` }}>
                  <span className="ruler-number">{i * 0.5}"</span>
                </div>
              ))}
            </div>
          </div>
          <div className="ruler ruler-vertical">
            <div className="ruler-marks">
              {Array.from({ length: 23 }, (_, i) => (
                <div key={i} className="ruler-mark" style={{ top: `${(i * 0.5 / 11) * 100}%` }}>
                  <span className="ruler-number">{i * 0.5}"</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {/* Print Preview Mode Indicator */}
      {printPreviewMode && (
        <div className="print-preview-indicator print:hidden">
          <div className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg">
            <Eye className="h-4 w-4 inline mr-2" />
            Print Preview Mode Active - This simulates how labels will appear when printed
          </div>
        </div>
      )}
      
      {/* Print Styles */}
      <style>{`
        /* Avery 5160 Label Sheet Specifications */
        .avery-5160-container {
          width: 8.5in;
          margin: 0 auto;
          position: relative;
        }

        .avery-5160-page {
          width: 8.5in;
          height: 11in;
          display: grid;
          grid-template-columns: repeat(3, 2.625in);
          grid-template-rows: repeat(10, 1in);
          grid-column-gap: 0.125in;
          grid-row-gap: 0;
          justify-content: start;
          padding: 0.5in 0.1875in;
          position: relative;
        }

        .page-break-after {
          page-break-after: always;
        }

        .avery-5160-label {
          width: 2.625in;
          height: 1in;
          border: 1px dashed #ccc;
          box-sizing: border-box;
          display: flex;
          align-items: center;
          justify-content: flex-start;
          position: relative;
          overflow: hidden;
        }

        .label-content {
          padding: 0.1in;
          width: 100%;
          height: 100%;
          font-family: Arial, sans-serif;
          font-size: 10pt;
          line-height: 1.2;
          overflow: hidden;
          position: relative;
          z-index: 2;
        }

        /* Test Pattern Styles */
        .test-pattern-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          text-align: center;
          position: relative;
        }

        .test-border {
          position: absolute;
          top: 2px;
          left: 2px;
          right: 2px;
          bottom: 2px;
          border: 1px solid #666;
          pointer-events: none;
        }

        /* Corner Markers */
        .corner-marker {
          position: absolute;
          width: 6px;
          height: 6px;
          background: #ff0000;
          z-index: 3;
        }

        .corner-marker.top-left {
          top: 0;
          left: 0;
        }

        .corner-marker.top-right {
          top: 0;
          right: 0;
        }

        .corner-marker.bottom-left {
          bottom: 0;
          left: 0;
        }

        .corner-marker.bottom-right {
          bottom: 0;
          right: 0;
        }

        /* Measurement Guides */
        .measurement-guide {
          position: absolute;
          background: rgba(0, 123, 255, 0.8);
          color: white;
          font-size: 8px;
          font-weight: bold;
          z-index: 4;
          padding: 1px 3px;
          border-radius: 2px;
        }

        .measurement-guide.horizontal-top {
          top: -12px;
          left: 50%;
          transform: translateX(-50%);
          white-space: nowrap;
        }

        .measurement-guide.vertical-left {
          left: -20px;
          top: 50%;
          transform: translateY(-50%) rotate(-90deg);
          transform-origin: center;
          white-space: nowrap;
        }

        /* Print-specific styles */
        @media print {
          * {
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
          }

          body {
            margin: 0 !important;
            padding: 0 !important;
            font-family: Arial, sans-serif;
          }

          .print\\:hidden {
            display: none !important;
          }

          .print\\:block {
            display: block !important;
          }

          .avery-5160-container {
            width: 8.5in !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          .avery-5160-page {
            width: 8.5in !important;
            height: 11in !important;
            margin: 0 !important;
            padding: 0.5in 0.1875in !important;
            display: grid !important;
            grid-template-columns: repeat(3, 2.625in) !important;
            grid-template-rows: repeat(10, 1in) !important;
            grid-column-gap: 0.125in !important;
            grid-row-gap: 0 !important;
            justify-content: start !important;
          }

          .page-break-after {
            page-break-after: always !important;
          }

          .avery-5160-label {
            width: 2.625in !important;
            height: 1in !important;
            border: none !important;
            box-sizing: border-box !important;
            page-break-inside: avoid;
          }

          .label-content {
            padding: 0.1in !important;
            font-size: 10pt !important;
            line-height: 1.2 !important;
            color: #000 !important;
            width: 100% !important;
            height: 100% !important;
          }

          /* Test pattern elements - only show if enabled */
          .corner-marker {
            width: 2px !important;
            height: 2px !important;
            background: #000 !important;
          }

          .test-pattern-content {
            color: #000 !important;
            font-size: 8pt !important;
          }

          .test-border {
            border: 0.5px solid #000 !important;
          }

          /* Hide screen-only elements */
          .measurement-rulers,
          .measurement-guide,
          .print-preview-indicator {
            display: none !important;
          }

          /* Alignment grid for test prints */
          .show-alignment-grid .avery-5160-page::before {
            background-image: 
              repeating-linear-gradient(90deg, 
                transparent, 
                transparent calc(2.625in - 0.5px), 
                #000 2.625in, 
                #000 calc(2.625in + 0.5px)
              ),
              repeating-linear-gradient(0deg,
                transparent,
                transparent calc(1in - 0.5px),
                #000 1in,
                #000 calc(1in + 0.5px)
              ) !important;
          }

          @page {
            size: letter;
            margin: 0;
          }
        }

        /* Alignment Grid Overlay */
        .show-alignment-grid .avery-5160-page::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-image: 
            repeating-linear-gradient(90deg, 
              transparent, 
              transparent calc(2.625in - 1px), 
              rgba(255, 0, 0, 0.3) 2.625in, 
              rgba(255, 0, 0, 0.3) calc(2.625in + 1px),
              transparent calc(2.625in + 2px),
              transparent calc(2.625in + 0.125in - 1px),
              rgba(255, 0, 0, 0.3) calc(2.625in + 0.125in),
              rgba(255, 0, 0, 0.3) calc(2.625in + 0.125in + 1px)
            ),
            repeating-linear-gradient(0deg,
              transparent,
              transparent calc(1in - 1px),
              rgba(255, 0, 0, 0.3) 1in,
              rgba(255, 0, 0, 0.3) calc(1in + 1px)
            );
          background-size: calc(2.625in + 0.125in) 1in;
          pointer-events: none;
          z-index: 1;
        }

        /* Enhanced borders for alignment testing */
        .show-alignment-grid .avery-5160-label {
          border: 2px solid #ff0000;
          border-style: solid;
        }

        /* Measurement Rulers */
        .measurement-rulers {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: 1;
        }

        .ruler {
          position: absolute;
          background: rgba(255, 255, 255, 0.9);
          border: 1px solid #007bff;
        }

        .ruler-horizontal {
          top: -25px;
          left: 0;
          width: 100%;
          height: 20px;
        }

        .ruler-vertical {
          left: -25px;
          top: 0;
          width: 20px;
          height: 100%;
        }

        .ruler-marks {
          position: relative;
          width: 100%;
          height: 100%;
        }

        .ruler-mark {
          position: absolute;
          background: #007bff;
        }

        .ruler-horizontal .ruler-mark {
          width: 1px;
          height: 8px;
          bottom: 0;
        }

        .ruler-vertical .ruler-mark {
          height: 1px;
          width: 8px;
          right: 0;
        }

        .ruler-number {
          position: absolute;
          font-size: 8px;
          color: #007bff;
          font-weight: bold;
        }

        .ruler-horizontal .ruler-number {
          bottom: 10px;
          left: 2px;
          white-space: nowrap;
        }

        .ruler-vertical .ruler-number {
          right: 10px;
          top: -3px;
          transform: rotate(-90deg);
          transform-origin: right center;
          white-space: nowrap;
        }

        /* Print Preview Mode */
        .print-preview-indicator {
          position: fixed;
          top: 20px;
          right: 20px;
          z-index: 1000;
        }

        .print-preview-mode .avery-5160-container {
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
          border: 2px solid #007bff;
        }

        .print-preview-mode .avery-5160-label {
          background: rgba(255, 255, 255, 0.95);
        }

        /* Screen-only styles */
        @media screen {
          .avery-5160-container {
            background: #f8f9fa;
            border-radius: 8px;
            padding: 1rem;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            margin-bottom: 2rem;
          }

          .avery-5160-page {
            background: white;
            border-radius: 4px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            margin-bottom: 2rem;
            position: relative;
          }

          .avery-5160-page:last-child {
            margin-bottom: 0;
          }

          .avery-5160-label {
            border-color: #e2e8f0;
            transition: all 0.2s ease;
          }

          .avery-5160-label:hover {
            background: rgba(0, 123, 255, 0.05);
            border-color: #007bff;
          }

          .label-content {
            color: #1e293b;
          }

          /* Screen-only measurement and testing elements */
          .corner-marker {
            opacity: 0.8;
          }

          .measurement-guide {
            font-size: 9px;
          }

          /* Hide rulers and test elements on small screens */
          @media (max-width: 768px) {
            .measurement-rulers,
            .measurement-guide {
              display: none;
            }
            
            .corner-marker {
              width: 4px;
              height: 4px;
            }
          }
        }
      `}</style>
    </div>
  );
}