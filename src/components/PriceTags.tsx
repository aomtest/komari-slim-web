import { Badge, Flex } from "@radix-ui/themes";
import { useTranslation } from "react-i18next";

const PriceTags = ({
  price = 0,
  billing_cycle = 30,
  currency = "￥",
  expired_at = Date.now() + 30 * 24 * 60 * 60 * 1000,
}: {
  expired_at?: string | number;
  price?: number;
  billing_cycle?: number;
  currency?: string;
}) => {
  if (price == 0) {
    return <></>;
  }
  const [t] = useTranslation();
  return (
    <Flex gap="1">
      <Badge color="iris" size="1" variant="soft" className="text-sm">
        <label className="text-xs">
          {price == -1 ? t("common.free") : `${currency}${price}`}/
          {(() => {
            if (billing_cycle >= 28 && billing_cycle <= 32) {
              return t("common.monthly");
            } else if (billing_cycle >= 87 && billing_cycle <= 95) {
              return t("common.quarterly");
            } else if (billing_cycle >= 175 && billing_cycle <= 185) {
              return t("common.semi_annual");
            } else if (billing_cycle >= 360 && billing_cycle <= 370) {
              return t("common.annual");
            } else if (billing_cycle >= 720 && billing_cycle <= 730) {
              return t("common.biennial");
            } else if (billing_cycle >= 1080 && billing_cycle <= 1100) {
              return t("common.triennial");
            } else if (billing_cycle == -1) {
              return t("common.once");
            } else {
              return `${billing_cycle} ${t("nodeCard.time_day")}`;
            }
          })()}
        </label>
      </Badge>
      <Badge
        color={(() => {
          const expiredDate = new Date(expired_at);
          const now = new Date();
          const diffTime = expiredDate.getTime() - now.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          if (diffDays <= 0 || diffDays <= 7) {
            return "red";
          } else if (diffDays <= 15) {
            return "orange";
          } else {
            return "green";
          }
        })()}
        size="1"
        variant="soft"
        className="text-sm"
      >
        <label className="text-xs">
          {(() => {
            const expiredDate = new Date(expired_at);
            const now = new Date();
            const diffTime = expiredDate.getTime() - now.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays <= 0) {
              return t("common.expired");
            } else if (diffDays > 36500) { // 100 years approximately
              return t("common.long_term");
            } else {
              return t("common.expired_in", {
                days: diffDays,
              });
            }
          })()}
        </label>
      </Badge>
    </Flex>
  );
};
export default PriceTags;
