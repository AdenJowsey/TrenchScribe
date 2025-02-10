class Model {
  name = "";
  modelName = "";
  isElite = false;
  isTough = false;
  isGlory = false;
  isEncumbered = false;
  movement = 0;
  ranged = 0;
  melee = 0;
  armour = 0;
  keywords = [];
  rangedWeapons = [];
  meleeWeapons = [];
  abilities = [];
  equipment = [];
  armours = [];
  upgrades = [];
}

class Upgrade {
  name = "";
  description = "";
}

class RangedWeapon {
  name = "";
  range = 0;
  hands = 0;
  keywords = [];
  modifiers = [];
  isGlory = false;
}

class MeleeWeapon {
  name = "";
  hands = 0;
  keywords = [];
  modifiers = [];
  isGlory = false;
}

class Armour {
  name = "";
  effect = 0;
  isGlory = false;
}

class Equipment {
  name = "";
  description = "";
  isGlory = false;
}

window.addEventListener("load", function () {
  let index = 0;
  const json = document.getElementById("input");
  const output = document.getElementById("output");
  const nextButton = document.getElementById("nextButton");
  const prevButton = document.getElementById("prevButton");
  const copyTitleButton = document.getElementById("copyTitleButton");
  const copyDescButton = document.getElementById("copyDescButton");
  const dialog = document.querySelector("dialog");
  const indexElement = document.getElementById("index");
  const ducantElement = document.getElementById("ducants");
  const glortyElement = document.getElementById("glory");
  indexElement.innerText = `-/-`;

  let membersArray = [];

  json?.addEventListener("input", update);
  nextButton?.addEventListener("click", () => {
    index++;
    indexElement.innerText = `${index + 1}/${membersArray.length}`;
    nextButton.disabled = index == membersArray.length - 1;
    prevButton.disabled = index == 0;
    render();
  });
  prevButton?.addEventListener("click", () => {
    index--;
    indexElement.innerText = `${index + 1}/${membersArray.length}`;
    nextButton.disabled = index == membersArray.length - 1;
    prevButton.disabled = index == 0;
    render();
  });
  copyTitleButton?.addEventListener("click", () => {
    if (!output) {
      return;
    }

    const regex = /TITLE:\n(.+?)\n/;
    const text = output.value.match(regex);
    if (!text?.[1]) {
      return;
    }

    const el = document.createElement("textarea");
    el.hidden = true;
    el.value = text[1];
    document.body.appendChild(el);
    el.select();
    navigator.clipboard.writeText(el.value);
    dialog.showModal();
    setTimeout(() => {
      dialog.close();
    }, 1000);
    document.body.removeChild(el);
  });
  copyDescButton?.addEventListener("click", () => {
    if (!output) {
      return;
    }

    const regex = /DESCRIPTION:\n((.*\n)*)/;
    const text = output.value.match(regex);
    if (!text?.[1]) {
      return;
    }

    const el = document.createElement("textarea");
    el.hidden = true;
    el.value = text[1];
    document.body.appendChild(el);
    el.select();
    navigator.clipboard.writeText(el.value);
    dialog.showModal();
    setTimeout(() => {
      dialog.close();
    }, 1000);
    document.body.removeChild(el);
  });

  function update() {
    let ducCost = 0;
    let gloryCost = 0;
    membersArray = [];
    indexElement.innerText = `-/-`;
    index = 0;
    if (nextButton) {
      nextButton.disabled = true;
    }
    if (prevButton) {
      prevButton.disabled = true;
    }
    if (copyTitleButton) {
      copyTitleButton.disabled = true;
    }
    if (copyDescButton) {
      copyDescButton.disabled = true;
    }
    output.innerText = "";

    if (!output) {
      console.error("Output not found");
    }

    if (!json) {
      output.innerText = "No JSON input";
      return;
    }

    let obj;
    try {
      obj = JSON.parse(json.value);
    } catch (error) {
      output.innerText = "Could not parse input";
      console.error("Could not parse input", error);
      return;
    }

    if (!obj?.Members) {
      output.innerText = "No Members found";
      console.error(`JSON does not conntain members: ${obj}`);
      return;
    }

    const members = obj.Members;
    if (!members.length) {
      output.innerText = "Members is empty";
      console.error(`Members is empty: ${members}`);
      return;
    }

    members.forEach((model) => {
      const member = new Model();
      member.name = model.Name ?? member.name;
      member.isElite = model.Elite ?? member.isElite;

      member.isGlory = model.Model?.CostType === "glory";
      member.isGlory
        ? (gloryCost += model.Model?.Cost ?? 0)
        : (ducCost += model.Model?.Cost ?? 0);
      if (model.Model?.Object) {
        const modelObject = model.Model.Object;
        member.modelName = modelObject.Name ?? member.modelName;
        member.movement = modelObject.Movement?.[0] ?? member.movement;
        member.ranged = modelObject.Ranged?.[0] ?? member.ranged;
        member.melee = modelObject.Melee?.[0] ?? member.melee;
        member.armour = modelObject.Armour?.[0] ?? member.armour;
        modelObject.Abilities?.forEach((ability) => {
          member.abilities.push(
            ability?.Content?.split("_")?.[1]?.toUpperCase()
          );
        });
        modelObject.Tags?.forEach((tag) => {
          member.keywords.push(tag?.tag_name?.toUpperCase());
        });
        member.isTough = member.keywords.includes("TOUGH");
      } else {
        console.warn("Model Object not found", model);
      }

      model.Upgrades?.forEach((upgrade) => {
        const up = new Upgrade();
        ducCost += upgrade.Cost ?? 0;
        up.name = upgrade.Name ?? up.name;
        up.description = upgrade.Description?.[0]?.Content ?? up.description;
        member.upgrades.push(up);
        const EventTags = upgrade.EventTags;
        if (EventTags.ranged) {
          member.ranged += EventTags.ranged;
        }
        if (EventTags.melee) {
          member.melee += EventTags.melee;
        }
        if (EventTags.armour) {
          member.armour += EventTags.armour;
        }
        if (EventTags.movement) {
          member.movement += EventTags.movement;
        }
      });

      let hasHeavy = false;

      model.Equipment.forEach((equip) => {
        if (!equip?.Object) {
          console.warn("Equipment Object not found", equip);
          return;
        }

        switch (equip?.Object?.Category) {
          case "ranged":
            const ranged = new RangedWeapon();
            ranged.name = equip.Object.Name ?? ranged.name;
            ranged.range = equip.Object.Range ?? ranged.range;
            ranged.isGlory = equip.CostType === "glory";
            ranged.isGlory
              ? (gloryCost += equip.Cost ?? 0)
              : (ducCost += equip.Cost ?? 0);
            ranged.hands = equip.Object.EquipType?.charAt(0) ?? ranged.hands;
            equip.Object.Tags?.forEach((tag) => {
              ranged.keywords.push(tag?.tag_name);
              if (tag?.tag_name === "Heavy") {
                hasHeavy = true;
              }
            });
            equip.Object.Modifiers?.forEach((mod) => {
              ranged.modifiers.push(mod);
            });
            member.rangedWeapons.push(ranged);
            break;
          case "melee":
            const melee = new MeleeWeapon();
            melee.name = equip.Object.Name ?? melee.name;
            melee.isGlory = equip.CostType === "glory";
            melee.isGlory
              ? (gloryCost += equip.Cost ?? 0)
              : (ducCost += equip.Cost ?? 0);
            melee.hands = equip.Object.EquipType?.charAt(0) ?? melee.hands;
            equip.Object.Tags?.forEach((tag) => {
              melee.keywords.push(tag?.tag_name);
              if (tag?.tag_name === "Heavy") {
                hasHeavy = true;
              }
            });
            equip.Object.Modifiers?.forEach((mod) => {
              melee.modifiers.push(mod);
            });
            member.meleeWeapons.push(melee);
            break;
          case "armour":
            const armour = new Armour();
            armour.name = equip.Object.Name ?? armour.name;
            armour.effect = equip.Object.EventTags?.armour ?? armour.effect;
            armour.isGlory = equip.CostType === "glory";
            armour.isGlory
              ? (gloryCost += equip.Cost ?? 0)
              : (ducCost += equip.Cost ?? 0);
            member.armours.push(armour);
            member.armour += armour.effect;
            break;
          case "equipment":
            const equipment = new Equipment();
            equipment.name = equip.Object.Name ?? equipment.name;
            equipment.isGlory = equip.CostType === "glory";
            equipment.isGlory
              ? (gloryCost += equip.Cost ?? 0)
              : (ducCost += equip.Cost ?? 0);
            equipment.description =
              equip.Object.Description?.[0]?.SubContent?.[0]?.Content ??
              equipment.description;
            member.equipment.push(equipment);
            break;
          default:
            break;
        }
      });

      if (hasHeavy && !member.keywords.includes("STRONG")) {
        member.isEncumbered = true;
      }
      membersArray.push(member);
    });
    if (membersArray.length > 1 && nextButton) {
      nextButton.disabled = false;
      indexElement.innerText = `1/${membersArray.length}`;
    }
    if (ducantElement) {
      ducantElement.innerText = ducCost;
    }
    if (glortyElement) {
      glortyElement.innerText = gloryCost;
    }

    if (membersArray.length > 0) {
      render();
    }
  }

  function render() {
    if (!output) {
      console.error("Output not found");
      return;
    }
    const member = membersArray[index];
    if (!member) {
      console.error("No memeber to render");
      return;
    }

    let outputString = "";
    outputString += `TITLE:\n`;
    const nameColour = member.isGlory
      ? "[FFD700]"
      : member.isElite
      ? "[ff9900]"
      : "";

    outputString += `${member.isTough ? "[00ff00][T][-] " : ""}${
      nameColour + member.name + "[-]"
    }${
      member.name !== member.modelName ? " - (" + member.modelName + ")" : ""
    }${member.isEncumbered ? " [cc3300][Encumbered][-]" : ""}\n\n`;

    outputString += `DESCRIPTION:\n`;
    outputString += `[b]Mo  Ra  Me  Ar[/b]\n`;
    const movementSpacing = member.movement < 10 ? " " : "";
    const rangedSpacing = member.ranged >= 0 ? " " : "";
    const meleeSpacing = member.melee >= 0 ? " " : "";
    const armourSpacing = member.armour >= 0 ? " " : "";
    outputString += ` ${movementSpacing}${member.movement}"  ${rangedSpacing}${member.ranged}   ${meleeSpacing}${member.melee}   ${armourSpacing}${member.armour}\n\n`;
    if (member.rangedWeapons.length > 0) {
      outputString += `[0099ff]Ranged Weapons:[-]\n`;
      member.rangedWeapons.forEach((ranged) => {
        outputString += `•${
          ranged.isGlory ? "[FFD700]" + ranged.name + "[-]" : ranged.name
        } - ${ranged.range} - ${ranged.hands}H\n`;
        ranged.modifiers.forEach((mod) => {
          outputString += `[i]${mod}[/i]\n`;
        });
        outputString += `[ff3300]${ranged.keywords.join(", ")}[-]\n`;
      });
      outputString += `\n`;
    }
    if (member.meleeWeapons.length > 0) {
      outputString += `[ff9933]Melee Weapons:[-]\n`;
      member.meleeWeapons.forEach((melee) => {
        outputString += `•${
          melee.isGlory ? "[FFD700]" + melee.name + "[-]" : melee.name
        } - ${melee.hands}H\n`;
        melee.modifiers.forEach((mod) => {
          outputString += `[i]${mod}[/i]\n`;
        });
        outputString += `[ff3300]${melee.keywords.join(", ")}[-]\n`;
      });
      outputString += `\n`;
    }
    if (member.abilities.length > 0) {
      outputString += `[cc00ff]Abilities:[-]\n`;
      member.abilities.forEach((ability) => {
        outputString += `[cc0000]${ability}[-]\n`;
      });
      outputString += `\n`;
    }
    if (member.equipment.length > 0) {
      outputString += `[ffff66]Equipment:[-]\n`;
      member.equipment.forEach((equip) => {
        outputString += `•${
          equip.isGlory ? "[FFD700]" + equip.name + "[-]" : equip.name
        }: [i]${equip.description}[/i]\n`;
      });
      outputString += `\n`;
    }
    if (member.armours.length > 0) {
      outputString += `[996633]Armours:[-]\n`;
      member.armours.forEach((armour) => {
        outputString += `•${
          armour.isGlory ? "[FFD700]" + armour.name + "[-]" : armour.name
        }: ${armour.effect}\n`;
      });
      outputString += `\n`;
    }
    if (member.upgrades.length > 0) {
      outputString += `[00cc00]Upgrades:[-]\n`;
      member.upgrades.forEach((up) => {
        outputString += `•${up.name}: [i]${up.description}[/i]\n`;
      });
      outputString += `\n`;
    }
    if (member.keywords.length > 0) {
      outputString += `[i]${member.keywords.join(", ")}[/i]\n`;
    }
    outputString += `\n`;

    output.innerHTML = outputString;

    copyTitleButton.disabled = false;
    copyDescButton.disabled = false;
  }

  if (!json) {
    return;
  }

  json.addEventListener("dragover", (event) => {
    event.preventDefault();
    json.classList.add("dragover");
  });

  json.addEventListener("dragleave", () => {
    json.classList.remove("dragover");
  });

  json.addEventListener("drop", (event) => {
    event.preventDefault();
    json.classList.remove("dragover");

    const file = event.dataTransfer.files[0];
    if (file && file.type === "application/json") {
      const reader = new FileReader();
      reader.readAsText(file);
      reader.onload = (e) => {
        json.value = JSON.stringify(JSON.parse(e.target.result));
        update();
      };
    } else {
      alert("Please drop a valid JSON file.");
    }
  });
});
