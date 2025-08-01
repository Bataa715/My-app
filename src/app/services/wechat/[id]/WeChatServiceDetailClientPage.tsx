
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { doc, getDoc, serverTimestamp, runTransaction, increment, collection as firestoreCollection } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/hooks/useTranslation";
import type { RecommendedItem, Order as AppOrder, NotificationItem, ItemType, City, ShowcaseItem } from "@/types"; 
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { ArrowLeft, Star, MapPin, AlertTriangle, Info, MessageCircle, ShoppingBag, PackageSearch } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { ServiceReviewForm } from "@/components/ServiceReviewForm";
import { useCity } from "@/contexts/CityContext"; 
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

const DetailItem: React.FC<{ labelKey: string; value?: string | string[] | null | number; icon?: React.ElementType; }> = ({ labelKey, value, icon: Icon }) => {
  const { t } = useTranslation();
  let displayValue = t('notProvided');
  if (value !== undefined && value !== null && value !== '') {
    if (Array.isArray(value)) {
      displayValue = value.join(', ');
    } else if (labelKey === 'ratingLabel' && typeof value === 'number') {
      displayValue = `${value.toFixed(1)} / 10`;
    } else {
      displayValue = value.toString();
    }
  }
  return (
    <div className="flex items-start text-sm">
      {Icon && <Icon className="h-5 w-5 text-muted-foreground mr-3 mt-0.5 shrink-0" />}
      <div>
        <p className="font-medium text-muted-foreground">{t(labelKey)}</p>
        <p className="text-foreground">{displayValue}</p>
      </div>
    </div>
  );
};

interface WeChatServiceDetailClientPageProps {
  params: { id: string };
  itemType: 'wechat';
  itemData: RecommendedItem | null;
}

export default function WeChatServiceDetailClientPage({ params, itemType, itemData }: WeChatServiceDetailClientPageProps) {
  const router = useRouter();
  const { t, language } = useTranslation(); 
  const { user } = useAuth();
  const { toast } = useToast();
  const { availableCities } = useCity(); 

  const [item, setItem] = useState<RecommendedItem | null>(itemData);
  const [loadingInitial, setLoadingInitial] = useState(!itemData && !!params.id);
  const [isBooking, setIsBooking] = useState(false);
  const [displayLocationName, setDisplayLocationName] = useState<string | null>(null);

  useEffect(() => {
    if (itemData) {
      setItem(itemData);
      setLoadingInitial(false);
      if (itemData.location && availableCities.length > 0) {
        const city = availableCities.find(c => c.value === itemData.location); 
        setDisplayLocationName(city ? (language === 'cn' && city.label_cn ? city.label_cn : city.label) : itemData.location);
      } else {
         setDisplayLocationName(itemData.location || null);
      }
    } else if (params.id && !itemData) {
      const fetchItem = async () => {
        setLoadingInitial(true);
        try {
          const docRef = doc(db, "entries", params.id);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const entryData = docSnap.data();
            if (entryData.categoryName === itemType) {
              const nestedData = entryData.data || {};
              const serviceName = nestedData.name || t('serviceUnnamed');
              const rawImageUrl = nestedData['cover-image'];
              const placeholder = `https://placehold.co/600x400.png?text=${encodeURIComponent(serviceName)}`;
              let imageUrlToUse: string;

              if (typeof rawImageUrl === 'string' && rawImageUrl.trim() !== '') {
                imageUrlToUse = rawImageUrl.trim();
              } else {
                imageUrlToUse = placeholder;
              }

              const rawWeChatQrUrl = nestedData.wechatQrImageUrl;
              let finalWeChatQrUrl: string | undefined = undefined;
              if (typeof rawWeChatQrUrl === 'string' && rawWeChatQrUrl.trim() !== '') {
                finalWeChatQrUrl = rawWeChatQrUrl.trim();
              }

              const showcaseItems: ShowcaseItem[] = (nestedData.delgerengui || []).map((detail: any) => ({
                description: detail.description || '',
                imageUrl: detail.imageUrl || `https://placehold.co/400x300.png?text=${encodeURIComponent(detail.name || t('productUnnamed') || 'Item')}`,
                name: detail.name || undefined,
                dataAiHint: detail.dataAiHint || (detail.name ? detail.name.substring(0,15) : (detail.description ? detail.description.substring(0,15) : "showcase item"))
              }));

              const fetchedItem = {
                id: docSnap.id,
                name: serviceName,
                imageUrl: imageUrlToUse,
                description: nestedData.description || '',
                location: nestedData.city || undefined, 
                averageRating: typeof nestedData.unelgee === 'number' ? nestedData.unelgee : null,
                reviewCount: typeof nestedData.reviewCount === 'number' ? nestedData.reviewCount : 0,
                totalRatingSum: typeof nestedData.totalRatingSum === 'number' ? nestedData.totalRatingSum : 0,
                price: nestedData.price === undefined ? null : nestedData.price,
                itemType: entryData.categoryName as ItemType,
                dataAiHint: nestedData.dataAiHint || "wechat item",
                wechatId: nestedData.wechatId,
                wechatQrImageUrl: finalWeChatQrUrl,
                showcaseItems: showcaseItems,
              } as RecommendedItem;
              setItem(fetchedItem);
              if (fetchedItem.location && availableCities.length > 0) {
                 const city = availableCities.find(c => c.value === fetchedItem.location);
                 setDisplayLocationName(city ? (language === 'cn' && city.label_cn ? city.label_cn : city.label) : fetchedItem.location);
              } else {
                setDisplayLocationName(fetchedItem.location || null);
              }
            } else {
              setItem(null);
              setDisplayLocationName(null);
            }
          } else {
            setItem(null);
            setDisplayLocationName(null);
          }
        } catch (error) {
          console.error("Error fetching WeChat entry client-side:", error);
          setItem(null);
          setDisplayLocationName(null);
        } finally {
          setLoadingInitial(false);
        }
      };
      fetchItem();
    }
  }, [itemData, params.id, itemType, t, availableCities, language]);

  useEffect(() => { 
    if (item?.location && availableCities.length > 0) {
        const city = availableCities.find(c => c.value === item.location);
        setDisplayLocationName(city ? (language === 'cn' && city.label_cn ? city.label_cn : city.label) : item.location);
    }
  }, [language, availableCities, item?.location, item]);

  const handleBookNow = async () => {
    if (!user) {
      toast({ title: t('loginToProceed'), description: t('loginToBookService'), variant: "destructive" });
      router.push('/auth/login');
      return;
    }
    if (!item) return;

    setIsBooking(true);
    try {
      const newOrderRef = doc(firestoreCollection(db, "orders"));
      const newNotificationRef = doc(firestoreCollection(db, "users", user.uid, "notifications"));
      const userDocRef = doc(db, "users", user.uid);
      
      await runTransaction(db, async (transaction) => {
        const orderData: Omit<AppOrder, 'id'> = {
          userId: user.uid,
          serviceType: itemType,
          serviceId: item.id,
          serviceName: item.name || t('serviceUnnamed'),
          orderDate: serverTimestamp(),
          status: 'confirmed', 
          imageUrl: item.imageUrl || null,
          dataAiHint: item.dataAiHint || "wechat service item",
          amount: item.price === undefined ? null : item.price,
        };
        transaction.set(newOrderRef, orderData);

        const notificationData: Omit<NotificationItem, 'id'> = {
          titleKey: 'orderSuccessNotificationTitle',
          descriptionKey: 'orderSuccessNotificationDescription',
          descriptionPlaceholders: { serviceName: item.name || t('serviceUnnamed') },
          date: serverTimestamp(),
          read: false,
          itemType: itemType,
          link: `/main/orders`,
          imageUrl: item.imageUrl || null,
          dataAiHint: item.dataAiHint || "wechat service item",
        };
        transaction.set(newNotificationRef, notificationData);

        transaction.update(userDocRef, { points: increment(15) });
      });


      toast({ title: t('orderSuccessNotificationTitle'), description: t('orderSuccessNotificationDescription', { serviceName: item.name || t('serviceUnnamed') }) });
    } catch (error) {
      console.error("Error ordering WeChat Service:", error);
      toast({ title: t('orderFailedNotificationTitle'), description: t('orderFailedNotificationDescription', { serviceName: item.name || t('serviceUnnamed') }), variant: "destructive" });
    } finally {
      setIsBooking(false);
    }
  };

  const onReviewSubmitted = (newAverageRating: number, newReviewCount: number, newTotalRatingSum: number) => {
    if (item) {
      setItem(prevItem => prevItem ? ({
        ...prevItem,
        averageRating: newAverageRating,
        reviewCount: newReviewCount,
        totalRatingSum: newTotalRatingSum,
      }) : null);
    }
  };

  const mainImageShouldUnoptimize = item?.imageUrl?.startsWith('data:') || item?.imageUrl?.includes('lh3.googleusercontent.com') || item?.imageUrl?.includes('placehold.co');
  const qrImageShouldUnoptimize = item?.wechatQrImageUrl?.startsWith('data:') || item?.wechatQrImageUrl?.includes('lh3.googleusercontent.com') || item?.wechatQrImageUrl?.includes('placehold.co');

  if (loadingInitial) {
    return (
      <div className="space-y-4 p-4">
        <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-md -mx-4 px-4">
          <div className="container mx-auto flex items-center justify-between h-16">
            <Skeleton className="h-10 w-10" />
            <Skeleton className="h-6 w-1/2" />
            <div className="w-10"></div>
          </div>
        </div>
        <Skeleton className="w-full h-64 rounded-lg" />
        <Skeleton className="h-8 w-3/4 mt-4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-4 w-2/3 mt-2" />
        <Skeleton className="h-4 w-1/2 mt-2" />
        <Skeleton className="h-12 w-full rounded-lg mt-6" />
      </div>
    );
  }

  if (!item) {
    return (
      <div className="container mx-auto py-8 text-center">
        <AlertTriangle className="mx-auto h-16 w-16 text-destructive mb-4" />
        <h1 className="text-2xl font-semibold mb-2">{t('itemNotFound')}</h1>
        <Button onClick={() => router.back()}>{t('back')}</Button>
      </div>
    );
  }

  const wechatId = item.wechatId;
  const wechatQrImageUrl = item.wechatQrImageUrl;

  return (
    <div className="pb-20">
      <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-md">
        <div className="container mx-auto flex items-center justify-between h-16">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <h1 className="text-lg font-semibold text-primary truncate px-2">
            {item?.name || t('wechatItemDetailTitle')}
          </h1>
          <div className="w-10"> {/* Spacer */}</div>
        </div>
      </div>

      <div className="container mx-auto py-2 md:py-6 px-2">
        <Card className="overflow-hidden shadow-xl mb-6">
          <CardHeader className="p-0 relative aspect-[16/10] md:aspect-[16/7]">
            <Image
              src={item.imageUrl || `https://placehold.co/600x400.png?text=${encodeURIComponent(item.name || 'WeChat')}`}
              alt={item.name || t('wechatItemDetailTitle')}
              layout="fill"
              objectFit="cover"
              className="bg-muted"
              data-ai-hint={item.dataAiHint || "wechat service item"}
              unoptimized={mainImageShouldUnoptimize}
            />
          </CardHeader>
          <CardContent className="p-4 md:p-6 space-y-6">
            <CardTitle className="text-2xl md:text-3xl font-headline">{item.name}</CardTitle>

            {item.description && (
              <div className="space-y-2">
                <h3 className="text-md font-semibold text-foreground flex items-center"><Info className="h-5 w-5 mr-2 text-primary"/>{t('descriptionLabel')}</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-line">{item.description}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              {displayLocationName && <DetailItem labelKey="locationLabel" value={displayLocationName} icon={MapPin} />}
              <div className="flex items-start text-sm">
                <Star className="h-5 w-5 text-muted-foreground mr-3 mt-0.5 shrink-0" />
                <div>
                    <p className="font-medium text-muted-foreground">{t('ratingLabel')}</p>
                    {item.averageRating !== null && item.averageRating !== undefined && item.reviewCount !== undefined ? (
                        <p className="text-foreground">{t('averageRatingDisplay', { averageRating: item.averageRating.toFixed(1), reviewCount: item.reviewCount })}</p>
                    ) : (
                        <p className="text-foreground">{t('noReviewsYet')}</p>
                    )}
                </div>
              </div>
              {wechatId && <DetailItem labelKey="wechatIdLabel" value={wechatId} icon={MessageCircle} />}
            </div>

            {wechatQrImageUrl && (
              <div className="mt-4">
                <h3 className="text-md font-semibold text-foreground mb-2">{t('wechatQrImageLabel')}</h3>
                <Image src={wechatQrImageUrl} alt={t('wechatQrImageLabel')} width={150} height={150} className="rounded-md border" data-ai-hint="qr code wechat" unoptimized={qrImageShouldUnoptimize} />
              </div>
            )}

            {item.showcaseItems && item.showcaseItems.length > 0 && (
              <div className="space-y-4 pt-4 border-t">
                <h3 className="text-xl font-semibold text-foreground flex items-center">
                  <PackageSearch className="h-6 w-6 mr-2 text-primary"/>
                  {t('productShowcaseTitle')}
                </h3>
                <ScrollArea className="w-full whitespace-nowrap rounded-md">
                  <div className="flex space-x-4 pb-4">
                    {item.showcaseItems.map((showcaseItem, index) => (
                      <Card key={index} className="overflow-hidden shadow-md hover:shadow-lg transition-shadow w-[280px] flex-shrink-0">
                        <div className="relative aspect-video">
                          <Image
                            src={showcaseItem.imageUrl || `https://placehold.co/400x225.png?text=${encodeURIComponent(showcaseItem.name || showcaseItem.description || t('productUnnamed') || 'Item')}`}
                            alt={showcaseItem.name || showcaseItem.description || t('productImageAlt') || 'Item image'}
                            layout="fill"
                            objectFit="cover"
                            className="bg-muted"
                            data-ai-hint={showcaseItem.dataAiHint || (showcaseItem.name ? showcaseItem.name.substring(0,15) : (showcaseItem.description ? showcaseItem.description.substring(0,15) : "showcase item"))}
                            unoptimized={showcaseItem.imageUrl?.startsWith('data:') || showcaseItem.imageUrl?.includes('lh3.googleusercontent.com') || showcaseItem.imageUrl?.includes('placehold.co')}
                          />
                        </div>
                        <CardContent className="p-3">
                          {showcaseItem.name && <CardTitle className="text-sm font-semibold mb-1 line-clamp-1">{showcaseItem.name}</CardTitle>}
                          <CardDescription className="text-xs text-muted-foreground line-clamp-2">
                            {showcaseItem.description || t('noProductDescription') || 'No description available.'}
                          </CardDescription>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                  <ScrollBar orientation="horizontal" />
                </ScrollArea>
              </div>
            )}
          </CardContent>
           <CardFooter className="p-4 md:p-6 border-t">
            <Button
              className="w-full bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white py-3 text-base h-12"
              onClick={handleBookNow}
              disabled={isBooking}
            >
              {isBooking ? t('loading') : (
                <>
                  <ShoppingBag className="mr-2 h-5 w-5" />
                  {t('orderNowButton')}
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
        <ServiceReviewForm
          itemId={item.id}
          itemType={item.itemType}
          currentAverageRating={item.averageRating ?? 0}
          currentReviewCount={item.reviewCount ?? 0}
          currentTotalRatingSum={item.totalRatingSum ?? 0}
          onReviewSubmitted={onReviewSubmitted}
        />
      </div>
    </div>
  );
}
