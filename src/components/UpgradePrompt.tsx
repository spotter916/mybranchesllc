import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Crown, ArrowRight } from "lucide-react";
import { Link } from "wouter";

interface UpgradePromptProps {
  feature: string;
  description: string;
  showInline?: boolean;
}

export default function UpgradePrompt({ feature, description, showInline = false }: UpgradePromptProps) {
  if (showInline) {
    return (
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg">
        <div className="flex items-center space-x-3">
          <Crown className="h-5 w-5 text-purple-600" />
          <div>
            <p className="font-medium text-purple-900">{feature}</p>
            <p className="text-sm text-purple-700">{description}</p>
          </div>
        </div>
        <Link href="/pricing">
          <Button variant="outline" size="sm" className="border-purple-300 text-purple-700 hover:bg-purple-100">
            Upgrade <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 border-purple-200">
      <CardHeader className="text-center">
        <div className="mx-auto w-16 h-16 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center mb-4">
          <Crown className="h-8 w-8 text-white" />
        </div>
        <CardTitle className="text-purple-900">Unlock {feature}</CardTitle>
        <CardDescription className="text-purple-700">
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent className="text-center">
        <div className="space-y-4">
          <div className="flex items-center justify-center space-x-2">
            <Badge variant="secondary" className="bg-purple-100 text-purple-800">
              Premium Feature
            </Badge>
          </div>
          <Link href="/pricing">
            <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
              Upgrade to Premium
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
          <p className="text-xs text-muted-foreground">
            Start your 14-day free trial today
          </p>
        </div>
      </CardContent>
    </Card>
  );
}